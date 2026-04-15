const API_KEY = 'AIzaSyCLmAWuMJ556dDkR1Ms41X5w03yMpsPVjw'; 
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// ---------------------------------------------------------
// 1. وظائف جلب البيانات من الـ API (البيانات الحية)
// ---------------------------------------------------------
// جلب الفيديوهات الأكثر رواجاً
async function fetchVideos() {
    try {
        const response = await fetch(`${BASE_URL}/videos?part=snippet,statistics&chart=mostPopular&maxResults=16&regionCode=EG&key=${API_KEY}`);
        const data = await response.json();
        renderVideos(data.items);
    } catch (error) { console.error("Error fetching trending:", error); }
}

// وظيفة البحث (للتصنيفات وللبحث العادي)
async function searchVideos(query) {
    try {
        const response = await fetch(`${BASE_URL}/search?part=snippet&maxResults=16&q=${query}&type=video&key=${API_KEY}`);
        const data = await response.json();
        renderVideos(data.items);
    } catch (error) { console.error("Error searching:", error); }
}


// ---------------------------------------------------------
// 2. وظائف العرض (رسم العناصر في الصفحة)
// ---------------------------------------------------------

function renderVideos(videos) {
    const videoGrid = document.getElementById('video-grid');
    
    // إذا لم يجد الشبكة، يتوقف الكود فوراً لمنع الأخطاء
    if (!videoGrid) return;

    // مسح الفيديوهات الحالية استعداداً لإضافة فيديوهات جديدة (سواء من البحث أو التصنيفات)
    videoGrid.innerHTML = '';

    videos.forEach(video => {
        // استخراج الـ ID (يوتيوب أحياناً يرسله كـ String وأحياناً داخل كائن VideoId)
        const videoId = typeof video.id === 'string' ? video.id : video.id.videoId;
        const info = video.snippet;

        // بناء كود HTML لكل فيديو
        const videoHTML = `
            <div class="video-card flex flex-col gap-3 cursor-pointer group" 
                 onclick="playVideo('${videoId}', '${encodeURIComponent(info.title)}', '${info.channelTitle}')">
                
                <!-- حاوية الصورة -->
                <div class="relative aspect-video rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                    <img src="${info.thumbnails.medium.url}" 
                         class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                         alt="${info.title}">
                </div>
                
                <!-- تفاصيل الفيديو (العنوان، القناة، الصورة الشخصية) -->
                <div class="flex gap-3">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(info.channelTitle)}&background=random" 
                         class="w-9 h-9 rounded-full shrink-0" alt="avatar">
                    
                    <div class="flex flex-col overflow-hidden">
                        <h3 class="text-sm font-bold dark:text-white line-clamp-2 leading-tight">${info.title}</h3>
                        <p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">${info.channelTitle}</p>
                    </div>
                </div>
            </div>`;
        
        // إضافة الفيديو للشبكة
        videoGrid.innerHTML += videoHTML;
    });
}

    // تفعيل الضغط على الفيديو للتشغيل
    document.querySelectorAll('.video-card').forEach(card => {
        card.onclick = () => {
            playVideo(card.dataset.id, decodeURIComponent(card.dataset.title), decodeURIComponent(card.dataset.channel));
        };
    });



// ---------------------------------------------------------
// 3. وظائف المشغل (Player) والتعليقات والمقترحات
// ---------------------------------------------------------

function playVideo(id, title, channel) {
    const player = document.getElementById('video-player-container');
    const iframe = document.getElementById('youtube-frame');
    const titleEl = document.getElementById('player-title');
    const channelEl = document.getElementById('player-channel');

    if (titleEl) titleEl.innerText = decodeURIComponent(title);
    if (channelEl) channelEl.innerText = channel;
    
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
    player.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    fetchComments(id);
    loadSuggestedVideos(channel);
    // إخفاء الناف بار السفلي عند تشغيل فيديو
    document.querySelector('.md\\:hidden.fixed.bottom-0')?.classList.add('hidden');
}

function closePlayer() {
    const player = document.getElementById('video-player-container');
    const iframe = document.getElementById('youtube-frame');
    iframe.src = '';
    player.classList.add('hidden');
    document.body.style.overflow = 'auto';
    // إظهار الناف بار السفلي عند العودة للرئيسية
    document.querySelector('.md\\:hidden.fixed.bottom-0')?.classList.remove('hidden'); 
}

async function loadSuggestedVideos(query) {
    const suggestedGrid = document.getElementById('suggested-videos');
    if (!suggestedGrid) return;
    try {
        const res = await fetch(`${BASE_URL}/search?part=snippet&maxResults=10&q=${query}&type=video&key=${API_KEY}`);
        const data = await res.json();
        suggestedGrid.innerHTML = '';
        data.items.forEach(item => {
            const id = item.id.videoId;
            const info = item.snippet;
            suggestedGrid.innerHTML += `
                <div class="flex gap-2 cursor-pointer group" onclick="playVideo('${id}', '${encodeURIComponent(info.title)}', '${info.channelTitle}')">
                    <div class="w-40 aspect-video rounded-lg overflow-hidden shrink-0">
                        <img src="${info.thumbnails.medium.url}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex flex-col overflow-hidden">
                        <h4 class="text-xs font-bold dark:text-white line-clamp-2 leading-tight">${info.title}</h4>
                        <p class="text-[10px] text-gray-500 mt-1">${info.channelTitle}</p>
                    </div>
                </div>`;
        });
    } catch (e) { console.error(e); }
}

async function fetchComments(videoId) {
    const container = document.getElementById('comments-container');
    if (!container) return;
    try {
        const res = await fetch(`${BASE_URL}/commentThreads?part=snippet&videoId=${videoId}&maxResults=8&key=${API_KEY}`);
        const data = await res.json();
        container.innerHTML = '';
        data.items.forEach(item => {
            const comment = item.snippet.topLevelComment.snippet;
            container.innerHTML += `
                <div class="flex gap-4 mb-4">
                    <img src="${comment.authorProfileImageUrl}" class="w-8 h-8 rounded-full">
                    <div class="text-sm">
                        <p class="font-bold dark:text-white">${comment.authorDisplayName}</p>
                        <p class="dark:text-gray-300">${comment.textDisplay}</p>
                    </div>
                </div>`;
        });
    } catch (e) { container.innerHTML = '<p class="dark:text-white text-xs">التعليقات غير متاحة.</p>'; }
}

// ---------------------------------------------------------
// 4. تشغيل الأحداث (Event Listeners) - تعمل عند تحميل الصفحة
// ---------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    fetchVideos(); // التحميل الأولي

    // أزرار التصنيفات
    const categoryButtons = document.querySelectorAll('.category-chip');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => {
                btn.className = "category-chip whitespace-nowrap bg-gray-100 dark:bg-zinc-800 text-black dark:text-white px-3 py-1 rounded-lg text-sm font-medium transition-all";
            });
            button.className = "category-chip whitespace-nowrap bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-lg text-sm font-medium transition-all";
            
            const category = button.innerText.trim();
            category === "الكل" ? fetchVideos() : searchVideos(category);
        });
    });

    // البحث العادي
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const runSearch = () => { if(searchInput.value.trim()) searchVideos(searchInput.value); };

    if(searchInput) searchInput.onkeypress = (e) => { if(e.key === 'Enter') runSearch(); };
    if(searchBtn) searchBtn.onclick = runSearch;

    // البحث الصوتي (يدعم أي لغة تتحدثين بها)
    const voiceBtn = document.getElementById('voice-search-btn');
const langIndicator = document.getElementById('lang-indicator');
let currentLang = 'ar-SA'; // اللغة الافتراضية

// وظيفة تبديل اللغة عند الضغط على المؤشر (AR <-> EN)
if (langIndicator) {
    langIndicator.onclick = () => {
        currentLang = (currentLang === 'ar-SA') ? 'en-US' : 'ar-SA';
        langIndicator.innerText = (currentLang === 'ar-SA') ? 'AR' : 'EN';
    };
}

if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    
    voiceBtn.onclick = () => {
        recognition.lang = currentLang; // يستخدم اللغة التي اخترناها
        voiceBtn.classList.add('animate-pulse', 'text-red-600');
        recognition.start();
    };

    recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        document.getElementById('search-input').value = text;
        searchVideos(text);
    };

    recognition.onend = () => voiceBtn.classList.remove('animate-pulse', 'text-red-600');
}

    // التنقل والمنيو
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    if(menuBtn) menuBtn.onclick = () => sidebar.classList.toggle('-translate-x-full');

    document.querySelector('[data-page="shorts"]')?.addEventListener('click', () => {
        fetchShorts();
        if (window.innerWidth < 1024) sidebar.classList.add('-translate-x-full');
    });

    document.querySelector('[data-page="home"]')?.addEventListener('click', () => {
        document.getElementById('shorts-grid')?.classList.add('hidden');
        fetchVideos();
        if (window.innerWidth < 1024) sidebar.classList.add('-translate-x-full');
    });

    // الدارك مود
    const darkToggle = document.getElementById('dark-mode-toggle');
    if(darkToggle) darkToggle.onclick = () => document.documentElement.classList.toggle('dark');

    // بحث الموبايل
    const mobileSearchBtn = document.getElementById('mobile-search-btn');
    const searchContainer = document.getElementById('search-container');
    if (mobileSearchBtn && searchContainer) {
        mobileSearchBtn.onclick = () => {
            searchContainer.classList.toggle('hidden');
            searchContainer.classList.add('flex', 'absolute', 'inset-x-0', 'top-0', 'bg-white', 'dark:bg-[#0f0f0f]', 'z-50', 'p-2');
        };
    }
    // عند الضغط على Shorts في السايدبار
document.querySelector('[data-page="shorts"]')?.addEventListener('click', () => {
    fetchShorts();
    // تلوين الزر المختار (اختياري)
    sidebar.classList.add('-translate-x-full'); // إغلاق للموبايل
});


// 2. أزرار الرئيسية (الكبيرة والصغيرة)
const homeButtons = document.querySelectorAll('.home-trigger');
homeButtons.forEach(btn => {
    btn.onclick = () => {
        const videoGrid = document.getElementById('video-grid');
        const shortsGrid = document.getElementById('shorts-grid');
        
        if(shortsGrid) shortsGrid.classList.add('hidden');
        if(videoGrid) videoGrid.classList.remove('hidden');
        
        fetchVideos();
        document.getElementById('sidebar').classList.add('-translate-x-full');
    };
});



// العودة للرئيسية
document.querySelector('[data-page="home"]')?.addEventListener('click', () => {
    document.getElementById('shorts-grid').classList.add('hidden');
    document.getElementById('video-grid').classList.remove('hidden');
    fetchVideos();
    sidebar.classList.add('-translate-x-full');
});
});
