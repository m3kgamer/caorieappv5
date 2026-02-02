// Barcode Scanner using QuaggaJS
const BarcodeScanner = {
    isScanning: false,
    modal: null,
    statusElement: null,
    overlayElement: null,
    onDetectCallback: null,

    init() {
        this.modal = document.getElementById('scannerModal');
        this.statusElement = document.getElementById('scannerStatus');
        this.overlayElement = document.getElementById('scannerOverlay');

        const openBtn = document.getElementById('openScannerBtn');
        const closeBtn = document.getElementById('closeScannerBtn');

        if (openBtn) {
            openBtn.addEventListener('click', () => this.openScanner());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeScanner());
        }

        // Close on outside click
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeScanner();
            }
        });
    },

    async openScanner(onDetect) {
        this.onDetectCallback = onDetect;

        if (this.modal) {
            this.modal.classList.remove('hidden');
            this.modal.classList.add('flex');
        }

        this.updateStatus('Requesting camera access...', 'info');

        // Small delay to allow modal to render
        setTimeout(() => {
            this.startScanning();
        }, 300);
    },

    closeScanner() {
        this.stopScanning();

        if (this.modal) {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('flex');
        }
    },

    async startScanning() {
        if (this.isScanning) return;

        try {
            this.updateStatus('Starting camera...', 'info');

            Quagga.init({
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: document.querySelector('#interactive'),
                    constraints: {
                        width: { min: 640 },
                        height: { min: 480 },
                        facingMode: "environment", // Use back camera on mobile
                        aspectRatio: { min: 1, max: 2 }
                    },
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true
                },
                numOfWorkers: navigator.hardwareConcurrency || 4,
                decoder: {
                    readers: [
                        "ean_reader",
                        "ean_8_reader",
                        "code_128_reader",
                        "upc_reader",
                        "upc_e_reader"
                    ]
                },
                locate: true
            }, (err) => {
                if (err) {
                    console.error('QuaggaJS initialization error:', err);
                    this.updateStatus('Camera access denied or not available. Please check permissions.', 'error');
                    return;
                }

                console.log('QuaggaJS initialized successfully');
                this.updateStatus('Camera ready! Position barcode in view...', 'success');
                this.isScanning = true;
                Quagga.start();
            });

            // Handle barcode detection
            Quagga.onDetected((result) => {
                if (result && result.codeResult && result.codeResult.code) {
                    const code = result.codeResult.code;
                    console.log('Barcode detected:', code);

                    // Visual feedback
                    this.showDetectionFeedback();

                    // Call the callback with detected barcode
                    if (this.onDetectCallback) {
                        this.onDetectCallback(code);
                    }

                    // Close scanner after successful detection
                    setTimeout(() => {
                        this.closeScanner();
                    }, 500);
                }
            });

        } catch (error) {
            console.error('Error starting scanner:', error);
            this.updateStatus('Failed to start camera. Please try again.', 'error');
        }
    },

    stopScanning() {
        if (this.isScanning) {
            Quagga.stop();
            this.isScanning = false;
            console.log('Scanner stopped');
        }
    },

    updateStatus(message, type = 'info') {
        if (!this.statusElement) return;

        const colors = {
            info: 'bg-blue-50 border-blue-200 text-blue-700',
            success: 'bg-green-50 border-green-200 text-green-700',
            error: 'bg-red-50 border-red-200 text-red-700'
        };

        this.statusElement.className = `mb-4 p-4 border rounded-xl text-center ${colors[type] || colors.info}`;
        this.statusElement.innerHTML = `<p class="font-medium">${message}</p>`;
    },

    showDetectionFeedback() {
        if (this.overlayElement) {
            this.overlayElement.style.opacity = '1';
            setTimeout(() => {
                this.overlayElement.style.opacity = '0';
            }, 300);
        }
    }
};

// Initialize scanner when DOM is loaded
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        BarcodeScanner.init();
    });
}
