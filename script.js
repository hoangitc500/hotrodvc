/**
 * script.js - Phiên bản cá nhân hóa cho Đỗ Việt Hoàng
 * Tích hợp: Voice Search (Reusable), Weather, PWA, Mobile Optimization, Driver.js Tour
 */

const CONFIG = {
    DATA_URL: 'data.json',
    CACHE_KEY: 'ninhbinh_support_portal_v3',
    CACHE_DURATION: 15 * 60 * 1000
};

// --- UTILS ---
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
    return str.toLowerCase().trim();
}

function showToast(msg) {
    const toast = document.getElementById("toast");
    if (toast) {
        toast.innerText = msg;
        toast.className = "show";
        setTimeout(() => toast.className = toast.className.replace("show", ""), 3000);
    }
}

function copyToClipboard(text, msg) {
    navigator.clipboard.writeText(text).then(() => showToast(msg)).catch(err => console.error(err));
}

// --- STATE ---
let globalData = { ministries: [], province: [], commune: [] };
let activeTab = 'all';

// --- ELEMENTS ---
const grid = document.getElementById('linkGrid');
const searchInput = document.getElementById('searchInput');
const noResultMsg = document.getElementById('noResult');
const modal = document.getElementById("supportModal");
const tableBody = document.getElementById("supportTableBody");
const modalSearchInput = document.getElementById("modalSearchInput");
const donateModal = document.getElementById("donateModal");
const backToTopBtn = document.getElementById("backToTopBtn");

// --- MAIN LOGIC ---
async function initData() {
    if (!grid) return;
    grid.innerHTML = '<div style="text-align:center; padding:20px;">⏳ Đang tải dữ liệu...</div>';

    try {
        const cached = localStorage.getItem(CONFIG.CACHE_KEY);
        if (cached) {
            const { timestamp, data } = JSON.parse(cached);
            if (new Date().getTime() - timestamp < CONFIG.CACHE_DURATION) {
                globalData = data;
                renderCards(globalData.ministries);
                return;
            }
        }

        const response = await fetch(CONFIG.DATA_URL);
        const freshData = await response.json();
        localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify({ timestamp: new Date().getTime(), data: freshData }));
        globalData = freshData;
        renderCards(globalData.ministries);
    } catch (error) {
        grid.innerHTML = `<p style="text-align:center;color:red">⚠️ Lỗi tải dữ liệu. Vui lòng thử lại.</p>`;
    }
}

function renderCards(data) {
    if (!grid) return;
    grid.innerHTML = '';
    if (!data || data.length === 0) {
        if (noResultMsg) noResultMsg.style.display = 'block';
    } else {
        if (noResultMsg) noResultMsg.style.display = 'none';
        data.forEach(dept => {
            const sysBtn = dept.system ? `<a href="${dept.system}" class="action-btn btn-sys-new" target="_blank"><img src="https://img.icons8.com/fluency/48/internet.png"><span>Hệ thống MCĐT</span></a>` : '';
            const docBtn = dept.doc ? `<a href="${dept.doc}" class="action-btn btn-doc-new" target="_blank"><img src="https://img.icons8.com/fluency/48/reading-ebook.png"><span>Tài liệu HDSD</span></a>` : '';
            const zaloBtn = dept.zalo ? `<a href="${dept.zalo}" class="action-btn btn-zalo-new" target="_blank"><img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"><span>Nhóm Zalo hỗ trợ</span></a>` : '';
            const reqBtn = dept.request ? `<a href="${dept.request}" class="action-btn btn-req-new" target="_blank"><img src="https://img.icons8.com/fluency/48/sent.png"><span>Gửi yêu cầu</span></a>` : '';

            const row = document.createElement('div');
            row.className = 'department-card';
            row.innerHTML = `<div class="card-header"><div class="header-deco"></div><div class="dept-name">${dept.name}</div></div><div class="card-actions">${sysBtn} ${docBtn} ${zaloBtn} ${reqBtn}</div>`;
            grid.appendChild(row);
        });
    }
}

// --- SEARCH & FILTER ---
function getAcronym(str) {
    if (!str) return '';
    const noTone = removeVietnameseTones(str);
    return noTone.split(/\s+/).map(word => word[0]).join('').toUpperCase();
}

function filterByTab(type, btn) {
    activeTab = type;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    applyFilter();
}

if (searchInput) {
    searchInput.addEventListener('input', applyFilter);
}

function applyFilter() {
    let filtered = globalData.ministries;

    if (activeTab === 'system') filtered = filtered.filter(i => i.system);
    if (activeTab === 'zalo') filtered = filtered.filter(i => i.zalo);
    if (activeTab === 'doc') filtered = filtered.filter(i => i.doc);

    const term = searchInput.value.trim();
    if (term) {
        const termNorm = removeVietnameseTones(term);
        const termAcronym = termNorm.toUpperCase().replace(/\s/g, '');

        filtered = filtered.filter(item => {
            const nameNorm = removeVietnameseTones(item.name);
            const nameAcronym = getAcronym(item.name);
            return nameNorm.includes(termNorm) || nameAcronym.includes(termAcronym);
        });
    }
    renderCards(filtered);
}

// --- SUPPORT MODAL & TABLE ---
function openSupportModal() {
    renderTable(globalData.province, globalData.commune);
    if (modal) modal.style.display = "block";
    document.body.style.overflow = "hidden";
    if (modalSearchInput) setTimeout(() => modalSearchInput.focus(), 100);
}

function closeSupportModal() {
    if (modal) modal.style.display = "none";
    document.body.style.overflow = "auto";
}

function renderTable(province, commune) {
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const isMobile = window.innerWidth <= 768;
    const iconCall = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
    const iconCopy = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

    const createRow = (item, idx) => {
        const row = document.createElement("tr");
        let phoneHtml = isMobile
            ? `<a href="tel:${item.sdt}" class="phone-link is-mobile-link">${iconCall} Gọi ${item.sdt}</a>`
            : `<span class="phone-link" onclick="copyToClipboard('${item.sdt}', 'Đã sao chép SĐT!')" style="cursor:pointer">${iconCopy} ${item.sdt}</span>`;

        row.innerHTML = `
            <td style="text-align: center; color: #64748b;">${idx + 1}</td>
            <td><span class="badge-scope">${item.phamvi}</span></td>
            <td class="user-name">${item.ten}</td>
            <td>${phoneHtml}</td>`;
        return row;
    };

    if (province) {
        const h1 = document.createElement("tr"); h1.innerHTML = `<td colspan="4" style="background:#eff6ff;font-weight:bold;color:#1e40af;padding:10px;">I. KHỐI SỞ BAN NGÀNH</td>`;
        tableBody.appendChild(h1);
        province.forEach((i, idx) => tableBody.appendChild(createRow(i, idx)));
    }
    if (commune) {
        const h2 = document.createElement("tr"); h2.innerHTML = `<td colspan="4" style="background:#eff6ff;font-weight:bold;color:#1e40af;padding:10px;margin-top:10px;">II. KHỐI XÃ/PHƯỜNG</td>`;
        tableBody.appendChild(h2);
        commune.forEach((i, idx) => tableBody.appendChild(createRow(i, idx)));
    }
}

function filterSupportTable() {
    if (!modalSearchInput) return;
    const term = modalSearchInput.value.trim();
    const termNorm = removeVietnameseTones(term);
    const termAcronym = termNorm.toUpperCase().replace(/\s/g, '');

    const checkMatch = (item) => {
        const phamviNorm = removeVietnameseTones(item.phamvi);
        const phamviAcronym = getAcronym(item.phamvi);
        const tenNorm = removeVietnameseTones(item.ten);
        const tenAcronym = getAcronym(item.ten);

        return phamviNorm.includes(termNorm) || phamviAcronym.includes(termAcronym) ||
            tenNorm.includes(termNorm) || tenAcronym.includes(termAcronym) ||
            (item.sdt && item.sdt.includes(term));
    };

    renderTable(
        globalData.province ? globalData.province.filter(checkMatch) : [],
        globalData.commune ? globalData.commune.filter(checkMatch) : []
    );
}

// --- VOICE SEARCH MODULE (REUSABLE) ---
function setupVoiceSearch(btnId, inputId, callback) {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return;

    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;

    const stopUI = () => {
        btn.classList.remove('listening');
        input.placeholder = input.getAttribute('data-original-placeholder') || "Tìm kiếm...";
    };

    // Lưu placeholder gốc để reset sau khi nói xong
    if (!input.getAttribute('data-original-placeholder')) {
        input.setAttribute('data-original-placeholder', input.placeholder);
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.classList.contains('listening')) {
            recognition.stop();
        } else {
            try {
                recognition.start();
                btn.classList.add('listening');
                input.placeholder = "Đang nghe...";
                input.focus();
            } catch (err) { stopUI(); }
        }
    });

    recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        input.value = text.replace(/\.$/, '');
        if (callback) callback(); // Gọi hàm lọc dữ liệu tương ứng
        stopUI();
    };

    recognition.onend = stopUI;
    recognition.onerror = stopUI;

    // Click out logic riêng biệt cho từng cặp nút/input
    document.addEventListener('click', (e) => {
        if (btn.classList.contains('listening') && !btn.contains(e.target) && !input.contains(e.target)) {
            recognition.stop();
            stopUI();
        }
    });
}

// --- WEATHER & GREETING ---
function initWeather() {
    const h = new Date().getHours();
    const msg = h < 11 ? "Chào buổi sáng ☀️" : h < 14 ? "Chào buổi trưa 🍚" : h < 18 ? "Chào buổi chiều 🌤️" : "Buổi tối vui vẻ 🌙";
    const el = document.getElementById('greetingMsg');
    if (el) el.innerText = msg;

    fetch('https://api.open-meteo.com/v1/forecast?latitude=20.25&longitude=105.97&current_weather=true&timezone=Asia%2FBangkok&windspeed_unit=kmh')
        .then(res => res.json())
        .then(d => {
            const t = d.current_weather.temperature;
            const w = document.getElementById('weatherInfo');
            if (w) w.innerHTML = `🌡️ Ninh Bình: <b>${t}°C</b>`;
        }).catch(e => console.log(e));
}

// --- REFRESH DATA ---
async function forceReloadData() {
    const txt = document.getElementById('refreshText');
    const icon = document.querySelector('.refresh-icon');
    if (txt) txt.innerText = "Đang đồng bộ...";
    if (icon) icon.classList.add('spin-anim');

    localStorage.removeItem(CONFIG.CACHE_KEY);
    await initData();

    setTimeout(() => {
        if (txt) txt.innerText = "Đã cập nhật!";
        if (icon) { icon.classList.remove('spin-anim'); icon.innerText = "✅"; }
        setTimeout(() => {
            if (txt) txt.innerText = "Làm mới dữ liệu";
            if (icon) icon.innerText = "🔄";
        }, 2000);
    }, 800);
}

// --- DONATE & SCROLL ---
function openDonateModal() { if (donateModal) donateModal.style.display = "block"; }
function closeDonateModal() { if (donateModal) donateModal.style.display = "none"; }
function copyBankNumber(num) { copyToClipboard(num, "Đã sao chép STK! ❤️"); }

window.onclick = (e) => {
    if (e.target == modal) closeSupportModal();
    if (e.target == donateModal) closeDonateModal();
};

// ĐÃ SỬA LỖI SCROLL NULL TẠI ĐÂY
window.onscroll = () => {
    const nav = document.querySelector('.portal-nav');
    if (nav) { // Kiểm tra nếu nav tồn tại thì mới chạy tiếp
        if (window.scrollY > 0) nav.classList.add('stuck'); else nav.classList.remove('stuck');
    }

    if (backToTopBtn) { // Kiểm tra nút backToTop có tồn tại không
        if (document.documentElement.scrollTop > 300) {
            backToTopBtn.classList.add("show-btn");
        } else {
            backToTopBtn.classList.remove("show-btn");
        }
    }
};

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

// --- WEBSITE TOUR (DRIVER.JS) ---
// (Đã xóa bỏ hàm initTour bị lặp thừa ở đây)

// --- WEBSITE TOUR (DRIVER.JS) ---
function initTour() {
    if (!window.driver) return;
    const driver = window.driver.js.driver;

    // Định nghĩa các bước (Steps)
    const tourSteps = [
        {
            element: '.portal-nav',
            popover: {
                title: 'Thanh điều hướng',
                description: 'Khu vực menu chính giúp bạn quay về trang chủ, tra cứu đầu mối hỗ trợ, xem hướng dẫn sử dụng web hoặc Donate.'
            }
        },
        {
            element: '.search-group',
            popover: {
                title: 'Tìm kiếm thông minh',
                description: 'Nhập tên Bộ ngành (hoặc từ viết tắt như "BYT") hoặc bấm nút Micro 🎤 để tìm bằng giọng nói.'
            }
        },
        {
            element: '.filter-tabs',
            popover: {
                title: 'Bộ lọc nhanh',
                description: 'Lọc nhanh danh sách các đơn vị có: Link hệ thống, Nhóm Zalo hỗ trợ hoặc Tài liệu HDSD.'
            }
        },
        // --- CÁC BƯỚC MỚI CHO CARD (Sử dụng Card đầu tiên làm mẫu) ---
        {
            element: '.department-card:first-child',
            popover: {
                title: 'Thẻ thông tin Bộ ngành',
                description: 'Mỗi thẻ đại diện cho một Bộ/Ngành, chứa đầy đủ các công cụ hỗ trợ cần thiết.'
            }
        },
        {
            element: '.department-card:first-child .btn-sys-new',
            popover: {
                title: 'Truy cập Hệ thống',
                description: 'Bấm vào đây để mở ngay trang Một cửa điện tử của Bộ ngành đó.'
            }
        },
        {
            element: '.department-card:first-child .btn-doc-new',
            popover: {
                title: 'Tài liệu Hướng dẫn',
                description: 'Tải về hoặc xem online các tài liệu hướng dẫn sử dụng, quy trình thực hiện.'
            }
        },
        {
            element: '.department-card:first-child .btn-zalo-new',
            popover: {
                title: 'Cộng đồng Zalo',
                description: 'Tham gia nhóm Zalo hỗ trợ kỹ thuật trực tiếp từ đội ngũ chuyên quản.'
            }
        },
        {
            element: '.department-card:first-child .btn-req-new',
            popover: {
                title: 'Gửi yêu cầu hỗ trợ',
                description: 'Gửi ticket hoặc form yêu cầu xử lý lỗi trực tiếp tới đơn vị.'
            }
        },
        // -------------------------------------------------------------
        {
            element: '.card-btn-support',
            popover: {
                title: 'Đầu mối hỗ trợ tại Ninh Bình',
                description: 'Tra cứu số điện thoại cán bộ phụ trách hỗ trợ của các Sở ban ngành và Xã/Phường trong tỉnh.'
            }
        }
    ];

    const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        // Cấu hình nút bấm
        nextBtnText: 'Tiếp theo ❯',
        prevBtnText: '❮ Quay lại',
        doneBtnText: 'Hoàn tất 🚀',
        steps: tourSteps,

        // --- ĐOẠN CODE QUAN TRỌNG CẦN SỬA ---
        onHighlightStarted: (element, step, options) => {
            if (!element) return;

            // 1. Tự động cuộn tới phần tử khi bắt đầu step
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // 2. Logic: Bấm vào Popup để Re-center (Chống trôi)
            // Cần setTimeout nhỏ để đảm bảo DOM của Popover đã được render
            setTimeout(() => {
                const popover = document.querySelector('.driver-popover');
                if (popover) {
                    // Thêm style con trỏ chuột để người dùng biết là bấm được
                    popover.style.cursor = 'pointer';
                    popover.title = "Bấm vào đây để quay về vị trí được hướng dẫn";

                    // Gán sự kiện click
                    popover.onclick = (e) => {
                        // Tránh conflict nếu bấm vào các nút Next/Prev
                        if (e.target.tagName === 'BUTTON') return;

                        // Cuộn lại về phần tử đang highlight
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

                        // Hiệu ứng nháy nhẹ phần tử để gây chú ý (Optional)
                        element.style.transition = "transform 0.2s";
                        element.style.transform = "scale(1.05)";
                        setTimeout(() => element.style.transform = "scale(1)", 200);
                    };
                }
            }, 200);
        }
    });

    // Hàm global để nút bấm gọi
    window.startTour = () => {
        // Kiểm tra xem dữ liệu đã load chưa, nếu chưa có card nào thì báo lỗi hoặc reload
        if (document.querySelectorAll('.department-card').length === 0) {
            showToast("⏳ Đang tải dữ liệu, vui lòng đợi...");
            return;
        }
        driverObj.drive();
    };

    // Tự động chạy lần đầu (giữ nguyên logic cũ của bạn)
    const hasSeenTour = localStorage.getItem('tour_seen_v2'); // Đổi key v2 để người dùng cũ cũng thấy lại giao diện mới
    if (!hasSeenTour) {
        // Đợi 2s để đảm bảo renderCards xong
        setTimeout(() => {
            if (document.querySelectorAll('.department-card').length > 0) {
                driverObj.drive();
                localStorage.setItem('tour_seen_v2', 'true');
            }
        }, 2000);
    }
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    initData();
    initWeather();
    initTour();

    setupVoiceSearch('voiceBtn', 'searchInput', () => {
        searchInput.dispatchEvent(new Event('input'));
    });

    setupVoiceSearch('modalVoiceBtn', 'modalSearchInput', () => {
        filterSupportTable();
    });

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
});