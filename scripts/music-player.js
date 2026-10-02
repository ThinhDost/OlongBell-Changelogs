/**
 * OlongBell Minecraft Server Music Player Engine
 */
class OlongBellMusicPlayer {
    constructor() {
        this.widget = document.getElementById('floating-music-player');
        this.toggleBtn = document.getElementById('music-toggle-btn');
        this.closePanelBtn = document.getElementById('music-close-panel-btn');
        this.audio = document.getElementById('bg-audio');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.prevBtn = document.getElementById('prev-track-btn');
        this.nextBtn = document.getElementById('next-track-btn');
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeIcon = document.getElementById('volume-icon');
        this.volumePercentage = document.getElementById('volume-percentage');
        this.playlistUl = document.getElementById('playlist-ul');
        this.titleDisplay = document.getElementById('current-track-title');
        this.discImg = document.getElementById('music-disc-img');

        // Danh sách bài hát thực tế của bạn
        this.playlist = [
            {
                id: "track-1",
                title: "Mad Trick",
                url: "assets/music/1.-Mad-Trick.mp3",
                alternativeUrl: "",
                cover: "assets/shirakami-fubuki-hololive_nobg.gif"
            },
            {
                id: "track-2",
                title: "Somebody",
                url: "assets/music/4.-Somebody.mp3",
                alternativeUrl: "",
                cover: "assets/shirakami-fubuki-hololive_nobg.gif"
            },
            {
                id: "track-3",
                title: "Someday",
                url: "assets/music/5.-Someday.mp3",
                alternativeUrl: "",
                cover: "assets/shirakami-fubuki-hololive_nobg.gif"
            },
            {
                id: "track-4",
                title: "Somewhere",
                url: "assets/music/6.-Somewhere.mp3",
                alternativeUrl: "",
                cover: "assets/shirakami-fubuki-hololive_nobg.gif"
            },
            {
                id: "track-5",
                title: "Somehow",
                url: "assets/music/Somehow.mp3",
                alternativeUrl: "",
                cover: "assets/shirakami-fubuki-hololive_nobg.gif"
            },
            {
                id: "track-6",
                title: "Snow Globe",
                url: "assets/music/Snow Globe.mp3",
                alternativeUrl: "",
                cover: "assets/shirakami-fubuki-hololive_nobg.gif"
            }
        ];

        this.currentIndex = 0;
        this.isPlaying = false;
        this.autoplayTriggered = false;

        this.init();
    }

    init() {
        if (!this.audio || !this.widget) return;

        this.loadSavedState();
        this.renderTrackSelector();
        this.loadTrack(this.currentIndex);
        this.bindEvents();
        this.setupAutoplayListener();
    }

    loadSavedState() {
        // Khôi phục mức âm lượng và bài hát đã chọn từ bộ nhớ trình duyệt
        const savedVolume = localStorage.getItem('music_volume');
        if (savedVolume !== null) {
            const vol = parseFloat(savedVolume);
            this.audio.volume = vol;
            if (this.volumeSlider) this.volumeSlider.value = savedVolume;
            if (this.volumePercentage) this.volumePercentage.textContent = `${Math.round(vol * 100)}%`;
        } else {
            this.audio.volume = 0.25; // Mặc định 25% âm lượng theo yêu cầu
            if (this.volumeSlider) this.volumeSlider.value = 0.25;
            if (this.volumePercentage) this.volumePercentage.textContent = "25%";
        }

        const savedTrackIndex = localStorage.getItem('music_track_index');
        if (savedTrackIndex !== null) {
            const index = parseInt(savedTrackIndex);
            if (index >= 0 && index < this.playlist.length) {
                this.currentIndex = index;
            }
        }
    }

    renderTrackSelector() {
        if (!this.playlistUl) return;
        
        // Kết xuất danh sách bài hát ra thẻ UL/LI
        this.playlistUl.innerHTML = this.playlist.map((track, index) => `
            <li class="playlist-item ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
                <span class="item-num">${String(index + 1).padStart(2, '0')}</span>
                <span class="item-title">${track.title}</span>
                <span class="item-play-icon"><i class="fa-solid fa-play"></i></span>
            </li>
        `).join('');

        // Gắn sự kiện click để phát bài hát khi chọn từ danh sách
        this.playlistUl.querySelectorAll('.playlist-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(item.dataset.index);
                this.loadTrack(index);
                this.play().catch(() => {});
            });
        });
    }

    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        this.currentIndex = index;
        const track = this.playlist[index];

        // Dọn dẹp nguồn cũ
        this.audio.innerHTML = '';

        // Nạp nguồn nhạc mới
        const sourceMp3 = document.createElement('source');
        sourceMp3.src = track.url;
        sourceMp3.type = 'audio/mpeg';
        this.audio.appendChild(sourceMp3);

        this.audio.load();

        if (this.titleDisplay) {
            this.titleDisplay.textContent = track.title;
        }

        // Cập nhật class active trong danh sách phát
        if (this.playlistUl) {
            this.playlistUl.querySelectorAll('.playlist-item').forEach((item, idx) => {
                item.classList.toggle('active', idx === index);
            });
        }

        // Cập nhật ảnh đĩa nhạc theo ảnh bìa của bài hát, dự phòng ảnh logo mặc định
        if (this.discImg) {
            this.discImg.src = track.cover || 'assets/shirakami-fubuki-hololive_nobg.gif';
            this.discImg.onerror = () => {
                this.discImg.src = 'assets/shirakami-fubuki-hololive_nobg.gif';
            };
        }

        localStorage.setItem('music_track_index', index);
    }

    bindEvents() {
        // Thu gọn / Mở rộng widget bằng cách nhấp đĩa nhạc
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.widget.classList.contains('collapsed')) {
                    this.widget.classList.remove('collapsed');
                } else {
                    // Nếu đang mở rộng thì nút đóng vai trò Play/Pause nhanh
                    this.togglePlay();
                }
            });
        }

        // Đóng panel chi tiết
        if (this.closePanelBtn) {
            this.closePanelBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.widget.classList.add('collapsed');
            });
        }

        // Tự đóng panel khi click ra ngoài widget
        document.addEventListener('click', (e) => {
            if (!this.widget.contains(e.target) && !this.widget.classList.contains('collapsed')) {
                this.widget.classList.add('collapsed');
            }
        });

        // Điều khiển Phát / Tạm dừng
        if (this.playPauseBtn) {
            this.playPauseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePlay();
            });
        }

        // Bài trước / Bài kế tiếp
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.prevTrack();
            });
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.nextTrack();
            });
        }

        // Thanh chỉnh âm lượng
        if (this.volumeSlider) {
            this.volumeSlider.addEventListener('input', (e) => {
                const vol = parseFloat(e.target.value);
                this.audio.volume = vol;
                localStorage.setItem('music_volume', vol);
                this.updateVolumeIcon(vol);
                if (this.volumePercentage) {
                    this.volumePercentage.textContent = `${Math.round(vol * 100)}%`;
                }
            });
        }

        // Sự kiện khi nhạc kết thúc (Tự động chuyển bài tiếp theo)
        this.audio.addEventListener('ended', () => {
            this.nextTrack();
        });
    }

    setupAutoplayListener() {
        // Thực hiện nạp và phát một bài hát ngẫu nhiên
        const startBgmPlayback = () => {
            if (this.isPlaying) return;
            const randomIndex = Math.floor(Math.random() * this.playlist.length);
            this.loadTrack(randomIndex);
            
            this.audio.volume = 0.25;
            if (this.volumeSlider) this.volumeSlider.value = 0.25;
            if (this.volumePercentage) this.volumePercentage.textContent = "25%";
            this.updateVolumeIcon(0.25);
            localStorage.setItem('music_volume', 0.25);

            this.play().then(() => {
                this.autoplayTriggered = true;
                removeEvents();
            }).catch(() => {});
        };

        // Sử dụng các tương tác hợp lệ của người dùng để bắt đầu phát nhạc ngay khi màn hình loading kết thúc
        const triggerAutoplay = () => {
            if (this.autoplayTriggered) return;
            
            const introScreen = document.getElementById('intro-screen');
            if (!introScreen || introScreen.style.display === 'none' || window.getComputedStyle(introScreen).opacity === '0') {
                this.autoplayTriggered = true;

                // Nếu Intro Voice đang phát, đợi giọng nói dứt hẳn rồi mới mở nhạc nền BGM
                if (window.isIntroVoicePlaying) {
                    const onVoiceEnd = () => {
                        window.removeEventListener('introVoiceEnded', onVoiceEnd);
                        startBgmPlayback();
                    };
                    window.addEventListener('introVoiceEnded', onVoiceEnd, { once: true });
                    // Dự phòng nếu không bắt được sự kiện ended sau 3.0s:
                    setTimeout(() => {
                        if (!this.isPlaying) startBgmPlayback();
                    }, 3000);
                } else {
                    startBgmPlayback();
                }
            }
        };

        const removeEvents = () => {
            window.removeEventListener('click', triggerAutoplay);
            window.removeEventListener('keydown', triggerAutoplay);
            const exploreBtn = document.querySelector('.btn-primary-action');
            if (exploreBtn) exploreBtn.removeEventListener('click', triggerAutoplay);
        };

        // Đăng ký các tương tác người dùng
        window.addEventListener('click', triggerAutoplay);
        window.addEventListener('keydown', triggerAutoplay);
        const exploreBtn = document.querySelector('.btn-primary-action');
        if (exploreBtn) exploreBtn.addEventListener('click', triggerAutoplay);

        // Kích hoạt autoplay sau 5.0 giây nếu trình duyệt cho phép phát tự động mà không cần click (để tránh đè nhạc lên Intro-Voice)
        setTimeout(() => {
            if (!this.autoplayTriggered) {
                if (window.isIntroVoicePlaying) {
                    window.addEventListener('introVoiceEnded', () => {
                        if (!this.autoplayTriggered) startBgmPlayback();
                    }, { once: true });
                } else {
                    startBgmPlayback();
                }
            }
        }, 5000);
    }

    play() {
        return this.audio.play()
            .then(() => {
                this.isPlaying = true;
                this.updateUIState();
            })
            .catch((err) => {
                this.isPlaying = false;
                this.updateUIState();
                throw err;
            });
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updateUIState();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play().catch(() => {});
        }
    }

    nextTrack() {
        let index = this.currentIndex + 1;
        if (index >= this.playlist.length) index = 0;
        this.loadTrack(index);
        this.play().catch(() => {});
    }

    prevTrack() {
        let index = this.currentIndex - 1;
        if (index < 0) index = this.playlist.length - 1;
        this.loadTrack(index);
        this.play().catch(() => {});
    }

    updateVolumeIcon(vol) {
        if (!this.volumeIcon) return;
        this.volumeIcon.className = '';
        if (vol === 0) {
            this.volumeIcon.className = 'fa-solid fa-volume-xmark';
        } else if (vol < 0.4) {
            this.volumeIcon.className = 'fa-solid fa-volume-low';
        } else {
            this.volumeIcon.className = 'fa-solid fa-volume-high';
        }
    }

    updateUIState() {
        if (this.isPlaying) {
            this.widget.classList.add('playing');
            if (this.playPauseBtn) this.playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        } else {
            this.widget.classList.remove('playing');
            if (this.playPauseBtn) this.playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    }
}

// Khởi chạy khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.olongbellMusic = new OlongBellMusicPlayer();
    }, 100);
});
