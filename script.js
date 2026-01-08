/**
 * script.js - Đã cập nhật tính năng Click-to-Copy
 * Updated: 2026-01-08
 */

// --- 1. CẤU HÌNH HỆ THỐNG ---
const CONFIG = {
    DATA_URL: 'data.json',
    CACHE_KEY: 'vnpt_portal_data_v1',
    CACHE_DURATION: 15 * 60 * 1000
};

// --- 2. CÁC HÀM TIỆN ÍCH ---
function removeVietnameseTones(str) {
    if (!str) return '';
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, " ");
    return str.toLowerCase().trim();
}

/**
 * MỚI: Hàm xử lý Copy và hiện Toast
 */
function copyPhoneNumber(phone) {
    // 1. Copy vào Clipboard
    navigator.clipboard.writeText(phone).then(() => {
        // 2. Hiện thông báo Toast
        const toast = document.getElementById("toast");
        if (toast) {
            toast.className = "show";
            // 3. Ẩn sau 3 giây
            setTimeout(function () {
                toast.className = toast.className.replace("show", "");
            }, 3000);
        }
    }).catch(err => {
        console.error('Không thể copy: ', err);
    });
}

// --- 3. STATE MANAGEMENT ---
let globalData = { ministries: [], province: [], commune: [] };
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

function showLoadingSkeleton() {
    if (!grid) return;
    // Tạo 6 ô skeleton giả
    grid.innerHTML = Array(6).fill('<div class="skeleton"></div>').join('');
}

// --- 4. CORE LOGIC ---
async function initData() {
    showLoadingSkeleton();
    try {
        const cachedRecord = localStorage.getItem(CONFIG.CACHE_KEY);
        if (cachedRecord) {
            const { timestamp, data } = JSON.parse(cachedRecord);
            const now = new Date().getTime();
            if (now - timestamp < CONFIG.CACHE_DURATION) {
                console.log('⚡ Loaded data from Cache');
                globalData = data;
                renderCards(globalData.ministries);
                return;
            }
        }

        console.log('🌐 Fetching data from Server...');
        const response = await fetch(CONFIG.DATA_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const freshData = await response.json();

        localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify({
            timestamp: new Date().getTime(),
            data: freshData
        }));

        globalData = freshData;
        renderCards(globalData.ministries);

    } catch (error) {
        console.error('CRITICAL ERROR:', error);
        grid.innerHTML = `<p style="text-align:center;color:red">⚠️ Lỗi tải dữ liệu.</p>`;
    }
}

// --- 5. RENDER & FILTER ---
function getAcronym(str) {
    // Ví dụ: "Bộ Y Tế" -> "BYT"
    const noTone = removeVietnameseTones(str);
    return noTone.split(/\s+/).map(word => word[0]).join('').toUpperCase();
}

function applyFilterAndRender() {
    let filtered = globalData.ministries;
    if (activeTab === 'system') filtered = filtered.filter(item => item.system);
    if (activeTab === 'zalo') filtered = filtered.filter(item => item.zalo);
    if (activeTab === 'doc') filtered = filtered.filter(item => item.doc);
    if (currentSearchTerm) {
        const termNormalized = removeVietnameseTones(currentSearchTerm);
        const termAcronym = termNormalized.toUpperCase().replace(/\s/g, ''); // Xóa khoảng trắng để so sánh acronym

        filtered = filtered.filter(item => {
            const nameNormalized = removeVietnameseTones(item.name);
            const nameAcronym = getAcronym(item.name); // Tạo acronym từ dữ liệu gốc

            return nameNormalized.includes(termNormalized) || // Tìm theo tên thường
                nameAcronym.includes(termAcronym);         // Tìm theo viết tắt (VD: BGD)
        });
    }
    renderCards(filtered);
}

function filterByTab(type, btnElement) {
    activeTab = type;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    applyFilterAndRender();
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value;
        applyFilterAndRender();
    });
}

function renderCards(data) {
    if (!grid) return;
    grid.innerHTML = '';
    if (!data || data.length === 0) {
        if (noResultMsg) noResultMsg.style.display = 'block';
    } else {
        if (noResultMsg) noResultMsg.style.display = 'none';
        data.forEach(dept => {
            const sysBtn = dept.system ? `<a href="${dept.system}" class="action-btn btn-sys-new" target="_blank"><img src="https://img.icons8.com/fluency/48/internet.png"><span>Truy cập Hệ thống</span></a>` : '';
            const docBtn = dept.doc ? `<a href="${dept.doc}" class="action-btn btn-doc-new" target="_blank"><img src="https://img.icons8.com/fluency/48/reading-ebook.png"><span>Tài liệu HDSD</span></a>` : '';
            const zaloBtn = dept.zalo ? `<a href="${dept.zalo}" class="action-btn btn-zalo-new" target="_blank"><img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"><span>Nhóm Zalo</span></a>` : '';
            const reqBtn = dept.request ? `<a href="${dept.request}" class="action-btn btn-req-new" target="_blank"><img src="https://img.icons8.com/fluency/48/sent.png"><span>Gửi yêu cầu</span></a>` : '';

            const row = document.createElement('div');
            row.className = 'department-card';
            row.innerHTML = `
                <div class="card-header"><div class="header-deco"></div><div class="dept-name">${dept.name}</div></div>
                <div class="card-actions">${sysBtn} ${docBtn} ${zaloBtn} ${reqBtn}</div>`;
            grid.appendChild(row);
        });
    }
}

// --- 6. LOGIC MODAL & TABLE (CẬP NHẬT RENDER TABLE) ---
function openSupportModal() {
    renderTable(globalData.province, globalData.commune);
    if (modalSearchInput) modalSearchInput.value = "";
    if (modal) modal.style.display = "block";
    document.body.style.overflow = "hidden";
    if (modalSearchInput) setTimeout(() => modalSearchInput.focus(), 100);
}

function closeSupportModal() {
    if (modal) modal.style.display = "none";
    document.body.style.overflow = "auto";
}

function openDonateModal() {
    if (donateModal) donateModal.style.display = "block";
    document.body.style.overflow = "hidden";
}

function closeDonateModal() {
    if (donateModal) donateModal.style.display = "none";
    document.body.style.overflow = "auto";
}

window.onclick = function (event) {
    if (event.target == modal) closeSupportModal();
    if (event.target == donateModal) closeDonateModal();
}

/**
 * CẬP NHẬT: Thay đổi thẻ <a> href="tel:" thành <span> onclick="copyPhoneNumber"
 */
function renderTable(province, commune) {
    if (!tableBody) return;
    tableBody.innerHTML = "";

    // Helper function để tạo dòng (giúp code gọn hơn)
    const createRow = (item, index) => {
        const row = document.createElement("tr");
        // Thay đổi ở đây: onclick="copyPhoneNumber..."
        row.innerHTML = `
            <td style="text-align: center; color: #64748b;">${index + 1}</td>
            <td><span class="badge-scope">${item.phamvi}</span></td>
            <td class="user-name">${item.ten}</td>
            <td>
                <span class="phone-link" onclick="copyPhoneNumber('${item.sdt}')" title="Bấm để sao chép" style="cursor:pointer">
                    ${item.sdt}
                </span>
            </td>`;
        return row;
    };

    if (province && province.length > 0) {
        const header1 = document.createElement("tr");
        header1.className = "section-header";
        header1.innerHTML = `<td colspan="4">I. KHỐI SỞ BAN NGÀNH (CẤP TỈNH)</td>`;
        tableBody.appendChild(header1);
        province.forEach((item, index) => tableBody.appendChild(createRow(item, index)));
    }

    if (commune && commune.length > 0) {
        const header2 = document.createElement("tr");
        header2.className = "section-header";
        header2.innerHTML = `<td colspan="4">II. KHỐI XÃ/PHƯỜNG (129 ĐƠN VỊ)</td>`;
        tableBody.appendChild(header2);
        commune.forEach((item, index) => tableBody.appendChild(createRow(item, index)));
    }
}

function filterSupportTable() {
    if (!modalSearchInput) return;
    const keyword = removeVietnameseTones(modalSearchInput.value);
    const checkMatch = (item) => removeVietnameseTones(item.phamvi).includes(keyword) || removeVietnameseTones(item.ten).includes(keyword) || (item.sdt && item.sdt.includes(keyword));
    renderTable(globalData.province ? globalData.province.filter(checkMatch) : [], globalData.commune ? globalData.commune.filter(checkMatch) : []);
}

// --- 7. SCROLL & INIT ---
window.onscroll = function () {
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        if (backToTopBtn && !backToTopBtn.classList.contains("show-btn")) backToTopBtn.classList.add("show-btn");
    } else {
        if (backToTopBtn) backToTopBtn.classList.remove("show-btn");
    }
    if (navBar) window.scrollY > 0 ? navBar.classList.add('stuck') : navBar.classList.remove('stuck');
};

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    initData();
});

async function forceReloadData() {
    const btn = document.querySelector('.refresh-btn');
    if (btn) btn.innerHTML = '⏳ Đang tải...';

    // 1. Xóa cache cũ
    localStorage.removeItem(CONFIG.CACHE_KEY);

    // 2. Gọi lại hàm initData
    await initData();

    // 3. Thông báo xong
    if (btn) btn.innerHTML = '✅ Đã cập nhật';
    setTimeout(() => { if (btn) btn.innerHTML = '🔄 Làm mới dữ liệu'; }, 2000);
}