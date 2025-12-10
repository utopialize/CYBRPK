export class AudioPlayer {
    constructor() {
        this.playlist = [
            'music/CYBRPK_background_01.mp3',
            'music/CYBRPK_background_02.mp3'
        ];
        this.currentTrack = 0;
        this.audio = new Audio();
        this.isPlaying = false;
        this.volume = 0.3; // Default 30%

        this.uiElements = {
            playBtn: null,
            nextBtn: null,
            volSlider: null,
            trackName: null,
            visualizer: null
        };
        
        this.init();
    }

    init() {
        this.audio.volume = this.volume;
        this.audio.addEventListener('ended', () => this.nextTrack());
        
        // Error handling
        this.audio.addEventListener('error', (e) => {
            console.error("Audio Error:", e);
        });
    }

    bindUI(elements) {
        this.uiElements = elements;

        // Bind Events
        if (this.uiElements.playBtn) {
            this.uiElements.playBtn.addEventListener('click', () => this.togglePlay());
        }
        if (this.uiElements.nextBtn) {
            this.uiElements.nextBtn.addEventListener('click', () => this.nextTrack());
        }
        if (this.uiElements.volSlider) {
            this.uiElements.volSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
            // Set initial value
            this.uiElements.volSlider.value = this.volume * 100;
        }

        this.updateUI();
    }

    loadTrack(index) {
        if (index >= 0 && index < this.playlist.length) {
            this.currentTrack = index;
            this.audio.src = this.playlist[index];
            this.audio.load();
            if (this.isPlaying) {
                this.audio.play().catch(e => console.warn("Auto-play prevented", e));
            }
            this.updateUI();
        }
    }

    togglePlay() {
        if (this.audio.paused) {
            // If source is empty, load first track
            if (!this.audio.src) {
                this.loadTrack(0);
            }
            this.audio.play().then(() => {
                this.isPlaying = true;
                this.updateUI();
            }).catch(e => {
                console.warn("Play failed (interaction required?)", e);
            });
        } else {
            this.audio.pause();
            this.isPlaying = false;
            this.updateUI();
        }
    }

    nextTrack() {
        let next = this.currentTrack + 1;
        if (next >= this.playlist.length) {
            next = 0; // Loop
        }
        this.loadTrack(next);
        // Force play on next if verified interaction
        if (!this.isPlaying) {
             this.togglePlay();
        } else {
             this.audio.play();
        }
    }

    setVolume(value) {
        // Value 0-100
        this.volume = value / 100;
        this.audio.volume = this.volume;
    }

    updateUI() {
        if (this.uiElements.trackName) {
            const track = this.playlist[this.currentTrack];
            // Extract filename without extension
            const name = track.split('/').pop().replace('.mp3', '').replace('CYBRPK_', '');
            this.uiElements.trackName.textContent = name;
        }

        if (this.uiElements.playBtn) {
            this.uiElements.playBtn.innerHTML = this.isPlaying ? '❚❚' : '▶';
            this.uiElements.playBtn.classList.toggle('active', this.isPlaying);
        }

        if (this.uiElements.visualizer) {
            this.uiElements.visualizer.classList.toggle('active', this.isPlaying);
        }
    }
}
