/* LAPAK GAMER frontend connected to the Pterodactyl API. */
(() => {
  "use strict";
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const API_BASE = String(window.LAPAK_GAMER_CONFIG?.API_BASE_URL || "http://alfa-store-officials.alfamarket2.my.id:3033").replace(/\/$/, "");
  const ADMIN_SESSION = "lapakGamer.adminToken";
  let apiListings = [];
  let adminToken = sessionStorage.getItem(ADMIN_SESSION) || "";
  const PAGE_SIZE = 6;
  const icons = {"Jasa Gaming":"🎮","Desain & Editing":"🎨","Produk Digital":"▧","Coaching":"⚡","Lainnya":"◈"};
  const seedListings = [
    {id:"seed-1",title:"Jasa Push Rank Mobile Legends",category:"Jasa Gaming",game:"Mobile Legends",price:25000,seller:"Raka Gaming",contact:"6281234567890",description:"Bantu push rank dengan komunikasi yang jelas. Bisa diskusi target rank dan jadwal terlebih dahulu. Tidak perlu membagikan password; utamakan metode aman dan sesuai aturan game.",image:"",createdAt:"2026-10-09T08:00:00.000Z",views:38,featured:true,seed:true},
    {id:"seed-2",title:"Desain Thumbnail Gaming YouTube",category:"Desain & Editing",game:"YouTube / Gaming",price:15000,seller:"PixelForge",contact:"6281234567891",description:"Thumbnail gaming custom dengan komposisi jelas dan warna yang menarik. Sertakan referensi dan teks yang ingin ditampilkan. Harga contoh, silakan diskusikan detail sebelum memesan.",image:"",createdAt:"2026-10-08T12:00:00.000Z",views:24,featured:true,seed:true},
    {id:"seed-3",title:"Paket Overlay Stream Minimalis",category:"Produk Digital",game:"Streaming",price:30000,seller:"Nexa Studio",contact:"6281234567892",description:"Paket aset overlay streaming bergaya neon untuk mulai merapikan tampilan stream. Pastikan format dan lisensi penggunaan dikonfirmasi ke penjual sebelum membeli.",image:"",createdAt:"2026-10-07T10:00:00.000Z",views:19,featured:false,seed:true},
    {id:"seed-4",title:"Coaching Aim & Game Sense FPS",category:"Coaching",game:"FPS",price:40000,seller:"AimLab ID",contact:"6281234567893",description:"Sesi coaching untuk membahas positioning, crosshair placement, aim routine, dan review gameplay. Jadwal dan game yang didukung dikonfirmasi langsung dengan coach.",image:"",createdAt:"2026-10-06T11:00:00.000Z",views:31,featured:true,seed:true},
    {id:"seed-5",title:"Jasa Edit Video Highlight Gameplay",category:"Desain & Editing",game:"Video Editing",price:20000,seller:"CutScene",contact:"6281234567894",description:"Edit highlight gameplay pendek untuk TikTok, Reels, atau Shorts. Kirim footage yang kamu miliki haknya, lalu diskusikan durasi, musik, dan revisi dengan editor.",image:"",createdAt:"2026-10-05T13:00:00.000Z",views:16,featured:false,seed:true},
    {id:"seed-6",title:"Template Overlay OBS Neon Blue",category:"Produk Digital",game:"OBS Studio",price:12000,seller:"BlueByte Assets",contact:"6281234567895",description:"Template visual overlay bertema neon biru untuk OBS. Pastikan kompatibilitas, isi file, dan ketentuan lisensi sebelum melakukan transaksi.",image:"",createdAt:"2026-10-04T09:00:00.000Z",views:27,featured:false,seed:true},
    {id:"seed-7",title:"Jasa Logo Tim Esports",category:"Desain & Editing",game:"Branding Esports",price:50000,seller:"Kuro Design",contact:"6281234567896",description:"Desain logo tim berdasarkan brief warna, nama, dan referensi. Tanyakan jumlah konsep, file final, dan hak penggunaan yang termasuk harga.",image:"",createdAt:"2026-10-03T09:00:00.000Z",views:22,featured:false,seed:true},
    {id:"seed-8",title:"Review Gameplay & Tips Rank",category:"Coaching",game:"MOBA / FPS",price:18000,seller:"Coach Vex",contact:"6281234567897",description:"Dapatkan masukan dari rekaman gameplay: keputusan, rotasi, komunikasi, dan kesalahan yang bisa diperbaiki. Game dan durasi sesi dikonfirmasi terlebih dahulu.",image:"",createdAt:"2026-10-02T09:00:00.000Z",views:12,featured:false,seed:true},
    {id:"seed-9",title:"Paket Emote Discord Gaming",category:"Produk Digital",game:"Discord",price:10000,seller:"Mochi Pixel",contact:"6281234567898",description:"Paket emote digital untuk server komunitas. Pastikan preview, jumlah file, format, dan izin penggunaan komersial bila dibutuhkan.",image:"",createdAt:"2026-10-01T09:00:00.000Z",views:15,featured:false,seed:true}
  ];
  let customListings = [];
  let activeCategory = "Semua";
  let visibleCount = PAGE_SIZE;
  let adminAuthed = Boolean(adminToken);
  let toastTimer;
  const money = n => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const allListings = () => apiListings;
  const getById = id => allListings().find(x => x.id === id);
  function saveCustom(){}
  async function api(path, options={}) {
    const headers={"Content-Type":"application/json",...(options.headers||{})};
    if(adminToken) headers.Authorization=`Bearer ${adminToken}`;
    let response; try { response=await fetch(`${API_BASE}${path}`,{...options,headers}); }
    catch { throw new Error(`Tidak dapat menghubungi API (${API_BASE}). Periksa alamat API, HTTPS, port, dan CORS.`); }
    const body=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(body.error || `Permintaan gagal (${response.status})`);
    return body;
  }
  const fromApi = x => ({...x,createdAt:x.createdAt||x.created_at||new Date().toISOString(),seed:false,featured:Boolean(x.featured),views:Number(x.views)||0});
  async function loadListings(){
    try { const result=await api('/api/v1/listings?page=1&limit=50&sort=newest'); apiListings=(result.data||[]).map(fromApi); renderListings();
      const status=$('#apiStatus'); if(status){status.textContent='API TERHUBUNG';status.classList.add('connected');status.classList.remove('disconnected');}
    } catch(err) { const status=$('#apiStatus'); if(status){status.textContent='API OFFLINE';status.classList.add('disconnected');status.title=err.message;} toast(err.message,true); renderListings(); }
  }
  function toast(message,error=false){const el=$("#toast");el.textContent=message;el.classList.remove("hidden","error");if(error)el.classList.add("error");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add("hidden"),3100)}
  function showModal(id){const el=$("#"+id);if(el)el.classList.remove("hidden");document.body.style.overflow="hidden";const focus=el?.querySelector("input,button,select,textarea");setTimeout(()=>focus?.focus(),40)}
  function closeModal(id){$("#"+id)?.classList.add("hidden");if(!$$(".modal-backdrop").some(el=>!el.classList.contains("hidden")))document.body.style.overflow=""}
  function openListingForm(){ $("#listingForm").reset();$("#listingNotice").classList.add("hidden");showModal("listingModal");}
  function formatDate(date){try{return new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"short",year:"numeric"}).format(new Date(date))}catch{return "Baru"}}
  function renderCard(item){
    const image = item.image && /^https?:\/\//i.test(item.image) ? `<img src="${escapeHtml(item.image)}" alt="" loading="lazy" onerror="this.remove()">` : "";
    return `<article class="listing-card">
      <div class="listing-visual"><div class="visual-grid"></div>${image}<span class="visual-symbol">${icons[item.category]||"◈"}</span><span class="category-badge">${escapeHtml(item.category)}</span>${item.featured?'<span class="featured-badge">✦ PILIHAN</span>':""}</div>
      <div class="card-content"><div class="game-line">${escapeHtml(item.game||"GAMING COMMUNITY").toUpperCase()}</div><h3 class="card-title">${escapeHtml(item.title)}</h3><p class="card-desc">${escapeHtml(item.description)}</p>
      <div class="seller-row"><span class="seller-avatar">${escapeHtml((item.seller||"?").trim().charAt(0).toUpperCase())}</span><div class="seller-info"><b>${escapeHtml(item.seller)}</b><small>Penjual komunitas · ${formatDate(item.createdAt)}</small></div><span class="seller-check" title="Listing tersedia">●</span></div>
      <div class="card-bottom"><div><span class="price-label">MULAI DARI</span><div class="price-value">${money(item.price)}</div></div><button class="card-open" data-detail="${escapeHtml(item.id)}">Lihat Lapak ↗</button></div></div></article>`;
  }
  function getFiltered(){
    const query=$("#searchInput").value.trim().toLowerCase();
    let list=allListings().filter(x=>{
      const matchCategory=activeCategory==="Semua"||x.category===activeCategory;
      const searchable=[x.title,x.category,x.game,x.seller,x.description].join(" ").toLowerCase();
      return matchCategory&&searchable.includes(query);
    });
    const sort=$("#sortSelect").value;
    if(sort==="price-low")list.sort((a,b)=>Number(a.price)-Number(b.price));
    else if(sort==="price-high")list.sort((a,b)=>Number(b.price)-Number(a.price));
    else if(sort==="popular")list.sort((a,b)=>Number(b.views||0)-Number(a.views||0));
    else list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    return list;
  }
  function renderListings(){
    const list=getFiltered();const shown=list.slice(0,visibleCount);
    $("#listingGrid").innerHTML=shown.map(renderCard).join("");
    $("#emptyState").classList.toggle("hidden",list.length!==0);
    $("#listingGrid").classList.toggle("hidden",list.length===0);
    $("#loadMore").classList.toggle("hidden",list.length<=visibleCount);
    $("#resultsText").textContent=`Menampilkan ${shown.length} dari ${list.length} lapak`;
    $$("#categoryFilters [data-category]").forEach(btn=>btn.classList.toggle("active",btn.dataset.category===activeCategory));
    const all=allListings();$("#heroListingCount").textContent=all.length+"+";$("#statTotal").textContent=all.length;
    $("#statServices").textContent=all.filter(x=>["Jasa Gaming","Coaching","Desain & Editing"].includes(x.category)).length;
    $("#statDigital").textContent=all.filter(x=>x.category==="Produk Digital").length;
  }
  async function renderDetail(id){
    let item=getById(id);if(!item)return;
    try { const result=await api(`/api/v1/listings/${encodeURIComponent(id)}`); item=fromApi(result.data); } catch(err) { toast(err.message,true); return; }
    const image=item.image&&/^https?:\/\//i.test(item.image)?`<img src="${escapeHtml(item.image)}" alt="" onerror="this.remove()">`:"";
    const wa=String(item.contact||"").replace(/\D/g,"");
    const waValid=wa.length>=8&&wa.length<=15;
    const message=encodeURIComponent(`Halo ${item.seller}, saya tertarik dengan lapak "${item.title}". Apakah masih tersedia?`);
    $("#detailContent").innerHTML=`<div class="detail-cover"><div class="visual-grid"></div>${image}<span class="visual-symbol">${icons[item.category]||"◈"}</span></div><div class="detail-category">${escapeHtml(item.category.toUpperCase())} · ${escapeHtml(item.game||"GAMING")}</div><h2 id="detailTitle">${escapeHtml(item.title)}</h2><div class="detail-price">${money(item.price)} <span style="font-size:10px;color:var(--muted);font-weight:500">/ harga awal</span></div><p class="detail-desc">${escapeHtml(item.description)}</p><div class="detail-meta"><div><small>PENJUAL</small><strong>${escapeHtml(item.seller)}</strong></div><div><small>DIPUBLIKASIKAN</small><strong>${formatDate(item.createdAt)}</strong></div><div><small>KATEGORI</small><strong>${escapeHtml(item.category)}</strong></div><div><small>DILIHAT</small><strong>${Number(item.views||0)+(!item.seed?0:1)} kali</strong></div></div><div class="detail-actions">${waValid?`<a class="btn btn-primary" href="https://wa.me/${wa}?text=${message}" target="_blank" rel="noopener noreferrer">Hubungi via WhatsApp ↗</a>`:""}<button class="btn btn-outline" id="copyListingLink">Salin info lapak</button></div><p class="security-note">Lapak Gamer hanya mempertemukan pengunjung dengan penjual. Verifikasi penjual, harga, hak penggunaan produk, dan ketentuan sebelum membayar. Jangan membagikan password atau kode OTP.</p>`;
    $("#copyListingLink").addEventListener("click",()=>{const text=`${item.title}\nPenjual: ${item.seller}\nKategori: ${item.category}\nHarga awal: ${money(item.price)}\nDeskripsi: ${item.description}`;if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>toast("Info lapak disalin.")).catch(()=>fallbackCopy(text));else fallbackCopy(text)});
    showModal("detailModal");
  }
  function fallbackCopy(text){const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");toast("Info lapak disalin.")}catch{toast("Tidak bisa menyalin otomatis.",true)}ta.remove()}
  async function renderAdmin(){
    const query=($('#adminSearch')?.value||'').trim().toLowerCase();
    try { const result=await api('/api/v1/admin/listings'); const rows=result.data||[];
      const list=rows.filter(x=>[x.title,x.seller,x.category,x.game].join(' ').toLowerCase().includes(query));
      $('#adminStats').innerHTML=`<div class="admin-stat"><strong>${rows.length}</strong><small>TOTAL LISTING</small></div><div class="admin-stat"><strong>${rows.filter(x=>x.status==='pending').length}</strong><small>MENUNGGU</small></div><div class="admin-stat"><strong>${rows.filter(x=>x.status==='approved').length}</strong><small>DITAYANGKAN</small></div>`;
      $('#adminListingTable').innerHTML=list.map(x=>`<div class="admin-row"><div><b>${escapeHtml(x.title)}</b><small>${escapeHtml(x.seller)} · ${escapeHtml(x.category)} · ${money(x.price)} · STATUS: ${escapeHtml(String(x.status||'pending').toUpperCase())}</small></div><div class="admin-row-actions">${x.status!=='approved'?`<button data-approve="${escapeHtml(x.id)}">Setujui</button>`:''}${x.status!=='rejected'?`<button data-reject="${escapeHtml(x.id)}">Tolak</button>`:''}<button data-toggle-feature="${escapeHtml(x.id)}">${x.featured?'Lepas pilihan':'Jadikan pilihan'}</button><button class="delete-btn" data-delete="${escapeHtml(x.id)}">Hapus</button></div></div>`).join('')||'<p class="security-note">Tidak ada listing yang cocok.</p>';
    } catch(err) { $('#adminListingTable').innerHTML=`<p class="form-error">${escapeHtml(err.message)}</p>`; toast(err.message,true); }
  }
  function openAdmin(){if(adminToken){renderAdmin();showModal("adminModal")}else showModal("adminLoginModal")}
  function setCategory(category){activeCategory=category;visibleCount=PAGE_SIZE;renderListings();$("#explore").scrollIntoView({behavior:"smooth",block:"start"})}
  // Main events
  ["sellTop","sellHero","sellSection","sellBottom"].forEach(id=>$("#"+id).addEventListener("click",openListingForm));
  ["adminNav","footerAdmin","openLogin"].forEach(id=>$("#"+id).addEventListener("click",openAdmin));
  $("#mobileMenu").addEventListener("click",()=>{const nav=$(".desktop-nav");const visible=nav.style.display==="flex";nav.style.display=visible?"none":"flex";if(!visible){nav.style.position="absolute";nav.style.top="69px";nav.style.left="0";nav.style.right="0";nav.style.padding="18px 24px";nav.style.background="#091522";nav.style.borderBottom="1px solid var(--line)";nav.style.flexDirection="column";nav.style.alignItems="flex-start";nav.style.gap="15px"}});
  $$("[data-close]").forEach(btn=>btn.addEventListener("click",()=>closeModal(btn.dataset.close)));
  $$(".modal-backdrop").forEach(backdrop=>backdrop.addEventListener("click",e=>{if(e.target===backdrop)closeModal(backdrop.id)}));
  document.addEventListener("keydown",e=>{if(e.key==="Escape")$$(".modal-backdrop:not(.hidden)").forEach(el=>closeModal(el.id));if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#searchInput").focus()}});
  $("#categoryFilters").addEventListener("click",e=>{const btn=e.target.closest("[data-category]");if(btn)setCategory(btn.dataset.category)});
  $("#searchInput").addEventListener("input",()=>{visibleCount=PAGE_SIZE;renderListings()});
  $("#sortSelect").addEventListener("change",renderListings);
  $("#resetFilters").addEventListener("click",resetFilters);$("#emptyReset").addEventListener("click",resetFilters);
  $("#loadMore").addEventListener("click",()=>{visibleCount+=PAGE_SIZE;renderListings()});
  function resetFilters(){$("#searchInput").value="";$("#sortSelect").value="newest";setCategory("Semua")}
  $("#listingGrid").addEventListener("click",e=>{const btn=e.target.closest("[data-detail]");if(btn)renderDetail(btn.dataset.detail)});
  $('#listingForm').addEventListener('submit',async e=>{
    e.preventDefault(); const form=e.currentTarget; const d=new FormData(form);
    const item={title:String(d.get('title')||'').trim(),category:String(d.get('category')||''),game:String(d.get('game')||'').trim(),price:Math.max(0,Number(d.get('price'))||0),seller:String(d.get('seller')||'').trim(),contact:String(d.get('contact')||'').replace(/[^\d+]/g,''),description:String(d.get('description')||'').trim(),image:String(d.get('image')||'').trim()};
    if(item.title.length<4||item.seller.length<2||item.contact.replace(/\D/g,'').length<8||item.description.length<10){toast('Periksa judul, nama penjual, nomor kontak, dan deskripsi (minimal 10 karakter).',true);return;}
    if(item.image&&!/^https:\/\//i.test(item.image)){toast('URL gambar harus menggunakan HTTPS.',true);return;}
    try { await api('/api/v1/listings',{method:'POST',body:JSON.stringify(item)}); form.reset(); closeModal('listingModal'); toast('Lapak dikirim dan menunggu persetujuan admin.'); await loadListings(); $('#searchInput').value=''; activeCategory='Semua'; visibleCount=PAGE_SIZE; renderListings(); $('#explore').scrollIntoView({behavior:'smooth'}); }
    catch(err){toast(err.message,true);}
  });
  $('#adminLoginForm').addEventListener('submit',async e=>{e.preventDefault();const password=String(new FormData(e.currentTarget).get('password')||'');const email=String(window.LAPAK_GAMER_CONFIG?.ADMIN_EMAIL||'admin@lapak-gamer.local');try{const result=await api('/api/v1/admin/login',{method:'POST',body:JSON.stringify({email,password})});adminToken=result.accessToken;adminAuthed=true;sessionStorage.setItem(ADMIN_SESSION,adminToken);$('#adminError').classList.add('hidden');e.currentTarget.reset();closeModal('adminLoginModal');await renderAdmin();showModal('adminModal');toast('Berhasil masuk panel admin.');}catch(err){$('#adminError').textContent=err.message;$('#adminError').classList.remove('hidden');}});
  $("#adminSearch").addEventListener("input",renderAdmin);
  $('#adminListingTable').addEventListener('click',async e=>{
    const detail=e.target.closest('[data-admin-detail]'); if(detail){closeModal('adminModal');renderDetail(detail.dataset.adminDetail);return;}
    const approve=e.target.closest('[data-approve]'), reject=e.target.closest('[data-reject]'), feature=e.target.closest('[data-toggle-feature]'), del=e.target.closest('[data-delete]');
    try { if(approve) await api(`/api/v1/admin/listings/${encodeURIComponent(approve.dataset.approve)}`,{method:'PATCH',body:JSON.stringify({status:'approved'})});
      else if(reject) await api(`/api/v1/admin/listings/${encodeURIComponent(reject.dataset.reject)}`,{method:'PATCH',body:JSON.stringify({status:'rejected'})});
      else if(feature){const row=(await api('/api/v1/admin/listings')).data.find(x=>x.id===feature.dataset.toggleFeature);if(row)await api(`/api/v1/admin/listings/${encodeURIComponent(row.id)}`,{method:'PATCH',body:JSON.stringify({featured:!row.featured})});}
      else if(del){if(!confirm('Hapus listing ini dari database server?'))return;await api(`/api/v1/admin/listings/${encodeURIComponent(del.dataset.delete)}`,{method:'DELETE'});}
      await loadListings(); await renderAdmin(); toast('Perubahan berhasil disimpan ke database server.');
    } catch(err){toast(err.message,true);}
  });
  $("#adminLogout").addEventListener("click",()=>{adminAuthed=false;adminToken="";sessionStorage.removeItem(ADMIN_SESSION);closeModal("adminModal");toast("Keluar dari panel admin.")});
  $("#exportData").addEventListener("click",()=>{toast("Ekspor data server belum tersedia di versi ini.",true);return;const blob=new Blob([JSON.stringify({app:"LAPAK GAMER",version:1,exportedAt:new Date().toISOString(),listings:customListings},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="lapak-gamer-backup.json";a.click();URL.revokeObjectURL(url);toast("Backup JSON diunduh.")});
  $("#importData").addEventListener("change",async e=>{toast("Impor lokal dinonaktifkan karena data tersimpan di server.",true);e.target.value="";return;const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());const rows=Array.isArray(data)?data:data.listings;if(!Array.isArray(rows))throw new Error("Format JSON tidak sesuai.");const clean=rows.filter(x=>x&&typeof x.title==="string"&&typeof x.seller==="string"&&typeof x.id==="string"&&!String(x.id).startsWith("seed-")).map(x=>({...x,seed:false}));if(!confirm(`Impor ${clean.length} listing? Listing lokal saat ini akan diganti.`))return;customListings=clean;saveCustom();renderListings();renderAdmin();toast("Data berhasil diimpor.")}catch(err){toast("Gagal impor: "+err.message,true)}finally{e.target.value=""}});
  $("#clearCustom").addEventListener("click",()=>{toast("Gunakan tombol Hapus pada setiap listing di panel admin.",true);return;if(confirm("Hapus semua listing yang dibuat pengguna dari browser ini? Listing contoh akan tetap ada.")){customListings=[];saveCustom();renderListings();renderAdmin();toast("Semua listing buatan pengguna dihapus.")}});
  $("#year").textContent=new Date().getFullYear();
  renderListings();
  loadListings();
})();
