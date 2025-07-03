document.addEventListener('alpine:init', () => {
    Alpine.data('setupPDFViewer', (initialFile) => ({
        filename: initialFile,
        pdfDoc: null,
        currentPage: 1,
        totalPages: 1,
        scale: 1.0,
        polygon: [],

        // inicia o carregamento do PDF ao montar o componente
        async init() {
            console.log("Filename recebido:", this.filename);

            // só segue se o container existir
            if (!this.$refs.pdfContainer) {
                console.warn("pdfContainer ainda não encontrado. Abortando inicialização.");
                return;
            }

            await this.loadPdf();
        },

        // carrega e escala o PDF conforme o tamanho do container
        async loadPdf() {
            try {
                const url = `/uploads/${this.filename}`;
                this.pdfDoc = await pdfjsLib.getDocument(url).promise;
                this.totalPages = this.pdfDoc.numPages;

                const firstPage = await this.pdfDoc.getPage(1);
                const unscaled = firstPage.getViewport({ scale: 1 });
                const containerW = this.$refs.pdfContainer.clientWidth;
                this.scale = containerW / unscaled.width;

                await this.renderPage(1);
            } catch (e) {
                console.error('Erro ao carregar PDF:', e);
            }
        },

        // carrega a página atual no canvas
        async renderPage(pageNumber) {
            if (!this.$refs.pdfCanvas || !this.pdfDoc) return;

            const page = await this.pdfDoc.getPage(pageNumber);
            const viewport = page.getViewport({ scale: this.scale });

            this.$refs.pdfCanvas.width = viewport.width;
            this.$refs.pdfCanvas.height = viewport.height;
            this.$refs.drawCanvas.width = viewport.width;
            this.$refs.drawCanvas.height = viewport.height;

            this.$refs.pdfCanvas.style.width = viewport.width + 'px';
            this.$refs.pdfCanvas.style.height = viewport.height + 'px';
            this.$refs.drawCanvas.style.width = viewport.width + 'px';
            this.$refs.drawCanvas.style.height = viewport.height + 'px';

            await page.render({
                canvasContext: this.$refs.pdfCanvas.getContext('2d'),
                viewport,
            }).promise;

            this.currentPage = pageNumber;
            this.drawPolygon();
        },

        addPoint(e) {
            const canvas = this.$refs.drawCanvas;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            const absX = (e.clientX - rect.left) * scaleX;
            const absY = (e.clientY - rect.top) * scaleY;

            this.polygon.push({
                x: absX / canvas.width,
                y: absY / canvas.height
            });
            this.drawPolygon();
        },

        drawPolygon() {
            const ctx = this.$refs.drawCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.$refs.drawCanvas.width, this.$refs.drawCanvas.height);

            if (this.polygon.length < 2) return;

            ctx.beginPath();
            ctx.moveTo(
                this.polygon[0].x * this.$refs.drawCanvas.width,
                this.polygon[0].y * this.$refs.drawCanvas.height
            );

            for (let i = 1; i < this.polygon.length; i++) {
                const pt = this.polygon[i];
                ctx.lineTo(
                    pt.x * this.$refs.drawCanvas.width,
                    pt.y * this.$refs.drawCanvas.height
                );
            }

            ctx.closePath();
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = 'rgba(0,255,0,0.2)';
            ctx.fill();
        },

        clearSelection() {
            this.polygon = [];
            this.drawPolygon();
            if (this.$refs.extractedText) this.$refs.extractedText.innerHTML = '';
        },

        extractText() {
            if (this.polygon.length < 3) {
                alert('Selecione pelo menos 3 pontos.');
                return;
            }

            fetch('/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    polygon: this.polygon,
                    filename: this.filename
                })
            })
                .then(res => res.ok ? res.json() : Promise.reject('Erro na resposta'))
                .then(data => {
                    if (this.$refs.extractedText) {
                        this.$refs.extractedText.innerHTML = data
                            .map((t, i) => `<strong>Página ${i + 1}:</strong> ${t}`)
                            .join('<br>');
                    }
                })
                .catch(err => {
                    console.error('Erro na extração:', err);
                    alert('Falha na extração: ' + err);
                });
        }
    }));
});
