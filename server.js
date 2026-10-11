require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "admin@lapak-gamer.local").trim().toLowerCase();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "");
const DB_FILE = path.resolve(process.env.DB_FILE || "./data/listings.json");
const tokens = new Map();

if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
  console.error("FATAL: Isi ADMIN_PASSWORD di .env dengan minimal 12 karakter.");
  process.exit(1);
}
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ listings: [] }, null, 2));

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use((req,res,next)=>{
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("Referrer-Policy","strict-origin-when-cross-origin");
  next();
});

function readDb() {
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE,"utf8"));
    if (!Array.isArray(data.listings)) data.listings = [];
    return data;
  } catch (e) { console.error("Database tidak bisa dibaca:",e.message); throw new Error("Database sedang bermasalah."); }
}
function writeDb(db) {
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db,null,2), { mode: 0o600 });
  fs.renameSync(tmp, DB_FILE);
}
function cleanListing(body) {
  const item = {
    title: String(body.title || "").trim().slice(0,120),
    category: String(body.category || "Lainnya").trim().slice(0,60),
    game: String(body.game || "").trim().slice(0,100),
    price: Number(body.price),
    seller: String(body.seller || "").trim().slice(0,100),
    contact: String(body.contact || "").replace(/[^\d+]/g,"").slice(0,24),
    description: String(body.description || "").trim().slice(0,2000),
    image: String(body.image || "").trim().slice(0,1000)
  };
  if(item.title.length<4) throw new Error("Judul minimal 4 karakter.");
  if(item.seller.length<2) throw new Error("Nama penjual minimal 2 karakter.");
  if(item.contact.replace(/\D/g,"").length<8) throw new Error("Nomor kontak tidak valid.");
  if(item.description.length<10) throw new Error("Deskripsi minimal 10 karakter.");
  if(!Number.isFinite(item.price)||item.price<0||item.price>100000000000) throw new Error("Harga tidak valid.");
  if(item.image && !/^https:\/\/[^\s]+$/i.test(item.image)) throw new Error("URL gambar harus HTTPS.");
  const categories=["Jasa Gaming","Desain & Editing","Produk Digital","Coaching","Lainnya"];
  if(!categories.includes(item.category)) item.category="Lainnya";
  return item;
}
function auth(req,res,next) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i,"");
  if(!token || !tokens.has(token)) return res.status(401).json({error:"Sesi admin tidak valid. Silakan login kembali."});
  next();
}
app.get("/health",(req,res)=>res.json({ok:true,service:"lapak-gamer",time:new Date().toISOString()}));
app.post("/api/v1/admin/login",(req,res)=>{
  const email=String(req.body.email||"").trim().toLowerCase();
  const password=String(req.body.password||"");
  const a=Buffer.from(email), b=Buffer.from(ADMIN_EMAIL);
  const emailOk=a.length===b.length && crypto.timingSafeEqual(a,b);
  const x=Buffer.from(password), y=Buffer.from(ADMIN_PASSWORD);
  const passwordOk=x.length===y.length && crypto.timingSafeEqual(x,y);
  if(!emailOk || !passwordOk) return res.status(401).json({error:"Email atau password admin salah."});
  const token=crypto.randomBytes(32).toString("hex");
  tokens.set(token,Date.now());
  res.json({accessToken:token,tokenType:"Bearer",expiresIn:86400});
});
app.get("/api/v1/listings",(req,res)=>{
  const db=readDb();
  let rows=db.listings.filter(x=>x.status==="approved");
  const sort=String(req.query.sort||"newest");
  if(sort==="price-low") rows.sort((a,b)=>a.price-b.price);
  else if(sort==="price-high") rows.sort((a,b)=>b.price-a.price);
  else rows.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const page=Math.max(1,Number.parseInt(req.query.page||"1",10)||1);
  const limit=Math.min(100,Math.max(1,Number.parseInt(req.query.limit||"50",10)||50));
  res.json({data:rows.slice((page-1)*limit,page*limit),pagination:{page,limit,total:rows.length}});
});
app.post("/api/v1/listings",(req,res)=>{
  try {
    const item=cleanListing(req.body||{});
    const db=readDb();
    const row={id:crypto.randomUUID(),...item,status:"pending",featured:false,views:0,createdAt:new Date().toISOString()};
    db.listings.unshift(row); writeDb(db);
    res.status(201).json({data:row,message:"Lapak dikirim untuk ditinjau admin."});
  } catch(e) { res.status(400).json({error:e.message||"Data listing tidak valid."}); }
});
app.get("/api/v1/admin/listings",auth,(req,res)=>{
  const db=readDb();
  db.listings.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  res.json({data:db.listings});
});
app.patch("/api/v1/admin/listings/:id",auth,(req,res)=>{
  const db=readDb(), row=db.listings.find(x=>x.id===req.params.id);
  if(!row) return res.status(404).json({error:"Listing tidak ditemukan."});
  if(req.body.status!==undefined) {
    if(!["pending","approved","rejected"].includes(req.body.status)) return res.status(400).json({error:"Status tidak valid."});
    row.status=req.body.status;
  }
  if(req.body.featured!==undefined) row.featured=Boolean(req.body.featured);
  row.updatedAt=new Date().toISOString(); writeDb(db); res.json({data:row});
});
app.delete("/api/v1/admin/listings/:id",auth,(req,res)=>{
  const db=readDb(), index=db.listings.findIndex(x=>x.id===req.params.id);
  if(index<0) return res.status(404).json({error:"Listing tidak ditemukan."});
  db.listings.splice(index,1); writeDb(db); res.json({ok:true});
});
app.use(express.static(path.join(__dirname,"public"),{extensions:["html"]}));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:"Terjadi kesalahan server."});});
app.listen(PORT,HOST,()=>console.log(`LAPAK GAMER aktif di http://${HOST}:${PORT} | database: ${DB_FILE}`));
