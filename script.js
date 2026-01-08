// --- CÁC HÀM TIỆN ÍCH ---
function removeVietnameseTones(str) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g," ");
    return str.toLowerCase().trim();
}

// Biến toàn cục để lưu dữ liệu sau khi tải
let globalData = {
    ministries: [],
    province: [],
    commune: []
};

let activeTab = 'all';
let currentSearchTerm = '';

// DOM Elements
const grid = document.getElementById('linkGrid');
const searchInput = document.getElementById('searchInput');
const noResultMsg = document.getElementById('noResult');
const modal = document.getElementById("supportModal");
const tableBody = document.getElementById("supportTableBody");
const modalSearchInput = document.getElementById("modalSearchInput");
const donateModal = document.getElementById("donateModal");
const backToTopBtn = document.getElementById("backToTopBtn");
const navBar = document.querySelector('.portal-nav');

// --- HÀM LOAD DATA ---
async function initData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Không thể tải file data.json');
        }
        globalData = await response.json();
        
        // Render dữ liệu lần đầu sau khi tải xong
        renderCards(globalData.ministries);
    } catch (error) {
        console.error('Lỗi:', error);
        grid.innerHTML = '<p style="text-align:center; color:red;">Lỗi tải dữ liệu. Vui lòng kiểm tra lại file data.json hoặc chạy trên Server.</p>';
    }
}

// --- LOGIC RENDER & FILTER ---
function applyFilterAndRender() {
    let filtered = globalData.ministries;
    if (activeTab === 'system') filtered = filtered.filter(item => item.system);
    if (activeTab === 'zalo') filtered = filtered.filter(item => item.zalo);
    if (activeTab === 'doc') filtered = filtered.filter(item => item.doc);

    if (currentSearchTerm) {
        const termNormalized = removeVietnameseTones(currentSearchTerm);
        filtered = filtered.filter(item => 
            removeVietnameseTones(item.name).includes(termNormalized)
        );
    }
    renderCards(filtered);
}

function filterByTab(type, btnElement) {
    activeTab = type;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    applyFilterAndRender();
}

searchInput.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value;
    applyFilterAndRender();
});

function renderCards(data) {
    grid.innerHTML = '';
    if (data.length === 0) {
        noResultMsg.style.display = 'block';
    } else {
        noResultMsg.style.display = 'none';
        data.forEach(dept => {
            const sysBtn = dept.system ? `<a href="${dept.system}" class="action-btn btn-sys-new" target="_blank" rel="noopener noreferrer"><img src="https://img.icons8.com/fluency/48/internet.png"><span>Truy cập Hệ thống MCĐT</span></a>` : '';
            const docBtn = dept.doc ? `<a href="${dept.doc}" class="action-btn btn-doc-new" target="_blank" rel="noopener noreferrer"><img src="https://img.icons8.com/fluency/48/reading-ebook.png"><span>Tài liệu HDSD</span></a>` : '';
            const zaloBtn = dept.zalo ? `<a href="${dept.zalo}" class="action-btn btn-zalo-new" target="_blank" rel="noopener noreferrer"><img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"><span>Nhóm Zalo hỗ trợ</span></a>` : '';
            const reqBtn = dept.request ? `<a href="${dept.request}" class="action-btn btn-req-new" target="_blank" rel="noopener noreferrer"><img src="https://img.icons8.com/fluency/48/sent.png"><span>Gửi yêu cầu hỗ trợ</span></a>` : '';

            const row = document.createElement('div');
            row.className = 'department-card';
            row.innerHTML = `
                <div class="card-header">
                    <div class="header-deco"></div>
                    <div class="dept-name">${dept.name}</div>
                </div>
                <div class="card-actions">
                    ${sysBtn} ${docBtn} ${zaloBtn} ${reqBtn}
                </div>`;
            grid.appendChild(row);
        });
    }
}

// --- LOGIC MODAL ---
function openSupportModal() {
    renderTable(globalData.province, globalData.commune);
    modalSearchInput.value = "";
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
    setTimeout(() => modalSearchInput.focus(), 100);
}

function closeSupportModal() {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
}

function openDonateModal() {
    donateModal.style.display = "block";
    document.body.style.overflow = "hidden";
}

function closeDonateModal() {
    donateModal.style.display = "none";
    document.body.style.overflow = "auto";
}

window.onclick = function (event) {
    if (event.target == modal) closeSupportModal();
    if (event.target == donateModal) closeDonateModal();
}

function renderTable(province, commune) {
    tableBody.innerHTML = "";
    if (province && province.length > 0) {
        const header1 = document.createElement("tr");
        header1.className = "section-header";
        header1.innerHTML = `<td colspan="4">I. KHỐI SỞ BAN NGÀNH (CẤP TỈNH)</td>`;
        tableBody.appendChild(header1);
        province.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `<td style="text-align: center; color: #64748b;">${index + 1}</td><td><span class="badge-scope">${item.phamvi}</span></td><td class="user-name">${item.ten}</td><td><a href="tel:${item.sdt}" class="phone-link">${item.sdt}</a></td>`;
            tableBody.appendChild(row);
        });
    }
    if (commune && commune.length > 0) {
        const header2 = document.createElement("tr");
        header2.className = "section-header";
        header2.innerHTML = `<td colspan="4">II. KHỐI XÃ/PHƯỜNG (129 ĐƠN VỊ)</td>`;
        tableBody.appendChild(header2);
        commune.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `<td style="text-align: center; color: #64748b;">${index + 1}</td><td><span class="badge-scope">${item.phamvi}</span></td><td class="user-name">${item.ten}</td><td><a href="tel:${item.sdt}" class="phone-link">${item.sdt}</a></td>`;
            tableBody.appendChild(row);
        });
    }
}

function filterSupportTable() {
    const keyword = removeVietnameseTones(modalSearchInput.value);
    
    const checkMatch = (item) => {
        return removeVietnameseTones(item.phamvi).includes(keyword) || 
               removeVietnameseTones(item.ten).includes(keyword) || 
               item.sdt.includes(keyword);
    }

    const filteredProvince = globalData.province.filter(checkMatch);
    const filteredCommune = globalData.commune.filter(checkMatch);
    renderTable(filteredProvince, filteredCommune);
}

// --- SCROLL & STICKY NAV ---
window.onscroll = function () {
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        if (!backToTopBtn.classList.contains("show-btn")) backToTopBtn.classList.add("show-btn");
    } else {
        backToTopBtn.classList.remove("show-btn");
    }
    
    if (navBar.getBoundingClientRect().top <= 0) {
        navBar.classList.add('stuck');
    } else {
        navBar.classList.remove('stuck');
    }
};

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// KHỞI CHẠY ỨNG DỤNG
initData();