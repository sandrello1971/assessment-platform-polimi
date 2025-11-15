from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER
import io
from datetime import datetime
from typing import Dict, List, Any
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

class PDFReportGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.page_width, self.page_height = A4
        
        # Percorsi template
        self.frontpage_template = '/var/www/assessment_ai/frontpage.png'
        self.report_template = '/var/www/assessment_ai/report.png'
        self.ai_template = '/var/www/assessment_ai/aiconclusion.png'
        
        # Area sicura per il contenuto (evita sovrapposizioni con grafica template)
        self.margin_left = 2.5*cm
        self.margin_right = 2*cm
        self.margin_top = 3.5*cm
        self.margin_bottom = 2*cm
        self.content_width = self.page_width - self.margin_left - self.margin_right

    def generate_assessment_report(self, session_data: Dict, results_data: List[Dict], 
                                 stats_data: Dict, ai_conclusions: str = None) -> bytes:
        """Genera il report PDF completo con template"""
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        
        # Pagina 1: Copertina
        self._draw_frontpage(c, session_data)
        c.showPage()
        
        # Pagina 2: Executive Summary con Radar Chart Globale (processi sovrapposti)
        self._draw_report_page(c)
        self._add_executive_summary_title(c)
        self._add_global_radar_overlay(c, stats_data)
        self._add_global_stats(c, stats_data)
        c.showPage()
        
        # Pagina 3: Strengths & Weaknesses Table
        self._draw_report_page(c)
        self._add_strengths_weaknesses_table(c, stats_data)
        c.showPage()
        
        # Pagina 4: Tutti i radar singoli (piccoli, in griglia)
        self._draw_report_page(c)
        self._add_all_process_radars(c, stats_data)
        c.showPage()
        
        # Pagina 5: Conclusioni AI (se disponibili)
        if ai_conclusions:
            self._draw_ai_page(c)
            self._add_ai_conclusions(c, ai_conclusions)
            c.showPage()
        
        c.save()
        buffer.seek(0)
        return buffer.getvalue()

    def _draw_frontpage(self, c: canvas.Canvas, session_data: Dict):
        """Disegna la pagina di copertina"""
        c.drawImage(self.frontpage_template, 0, 0, width=self.page_width, height=self.page_height)
        
        # Nome azienda
        company_name = session_data.get('azienda_nome', 'Azienda')
        c.setFont('Helvetica-Bold', 36)
        c.setFillColor(colors.HexColor('#3DBFBF'))
        text_width = c.stringWidth(company_name, 'Helvetica-Bold', 36)
        x_pos = (self.page_width - text_width) / 2
        y_pos = self.page_height * 0.35
        c.drawString(x_pos, y_pos, company_name)
        
        # Data
        date_str = datetime.now().strftime('%d/%m/%Y')
        c.setFont('Helvetica', 14)
        c.setFillColor(colors.HexColor('#3DBFBF'))
        text_width = c.stringWidth(date_str, 'Helvetica', 14)
        x_pos = (self.page_width - text_width) / 2
        y_pos = self.page_height * 0.22
        c.drawString(x_pos, y_pos, date_str)

    def _draw_report_page(self, c: canvas.Canvas):
        """Disegna una pagina con template report"""
        c.drawImage(self.report_template, 0, 0, width=self.page_width, height=self.page_height)

    def _draw_ai_page(self, c: canvas.Canvas):
        """Disegna una pagina con template AI conclusions"""
        c.drawImage(self.ai_template, 0, 0, width=self.page_width, height=self.page_height)

    def _add_executive_summary_title(self, c: canvas.Canvas):
        """Aggiunge titolo Executive Summary"""
        c.setFont('Helvetica-Bold', 20)
        c.setFillColor(colors.HexColor('#2C3E50'))
        c.drawString(self.margin_left, self.page_height - self.margin_top, "EXECUTIVE SUMMARY")

    def _add_global_radar_overlay(self, c: canvas.Canvas, stats_data: Dict):
        """Crea radar chart con tutti i processi sovrapposti sulle 4 dimensioni"""
        processes_radar = stats_data.get('processes_radar', [])
        
        if not processes_radar:
            return
        
        # Crea figura matplotlib
        fig, ax = plt.subplots(figsize=(7, 7), subplot_kw=dict(projection='polar'))
        
        # Le 4 dimensioni
        dimensions = ['Governance', 'M&C', 'Technology', 'Organization']
        num_dims = len(dimensions)
        angles = np.linspace(0, 2 * np.pi, num_dims, endpoint=False).tolist()
        angles += angles[:1]  # Chiudi il poligono
        
        # Colori per i processi
        colors_list = ['#8B5CF6', '#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#EC4899', '#06B6D4', '#84CC16']
        
        # Disegna ogni processo
        for i, process_data in enumerate(processes_radar):
            dims = process_data.get('dimensions', {})
            values = [
                dims.get('governance', 0),
                dims.get('monitoring_control', 0),
                dims.get('technology', 0),
                dims.get('organization', 0)
            ]
            values += values[:1]  # Chiudi il poligono
            
            color = colors_list[i % len(colors_list)]
            process_name = process_data.get('process', f'Process {i+1}')
            overall = process_data.get('overall_score', 0)
            
            ax.plot(angles, values, 'o-', linewidth=2, color=color, 
                   label=f"{process_name} ({overall:.2f})", markersize=4)
            ax.fill(angles, values, alpha=0.1, color=color)
        
        ax.set_xticks(angles[:-1])
        ax.set_xticklabels(dimensions, size=10, weight='bold')
        ax.set_ylim(0, 5)
        ax.set_yticks([1, 2, 3, 4, 5])
        ax.set_yticklabels(['1', '2', '3', '4', '5'], size=8)
        ax.grid(True, alpha=0.3)
        
        # Legenda a destra
        ax.legend(loc='center left', bbox_to_anchor=(1.15, 0.5), fontsize=8)
        
        plt.title('Global Radar - Processi vs Domini', size=14, weight='bold', y=1.08)
        
        # Salva in buffer
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=120, bbox_inches='tight')
        plt.close()
        img_buffer.seek(0)
        
        # Aggiungi al PDF
        from reportlab.lib.utils import ImageReader
        img = ImageReader(img_buffer)
        c.drawImage(img, self.margin_left, self.page_height - 16*cm, width=15*cm, height=12*cm)

    def _add_global_stats(self, c: canvas.Canvas, stats_data: Dict):
        """Aggiunge statistiche globali"""
        overall_avg = stats_data.get('overall_average', 0)
        total_q = stats_data.get('total_questions', 0)
        applicable_q = stats_data.get('applicable_questions', 0)
        na_q = stats_data.get('not_applicable_questions', 0)
        
        y_pos = self.page_height - 18*cm
        
        c.setFont('Helvetica-Bold', 14)
        c.setFillColor(colors.HexColor('#2C3E50'))
        c.drawString(self.margin_left, y_pos, "METRICHE GENERALI")
        
        y_pos -= 0.8*cm
        c.setFont('Helvetica', 11)
        c.setFillColor(colors.HexColor('#333333'))
        
        metrics = [
            f"Punteggio Complessivo: {overall_avg:.2f}/5.00",
            f"Domande Totali: {total_q}",
            f"Domande Applicabili: {applicable_q}",
            f"Domande Non Applicabili: {na_q}",
            f"Tasso Completamento: {(applicable_q/max(total_q,1)*100):.1f}%"
        ]
        
        for metric in metrics:
            c.drawString(self.margin_left + 0.5*cm, y_pos, metric)
            y_pos -= 0.6*cm

    def _add_strengths_weaknesses_table(self, c: canvas.Canvas, stats_data: Dict):
        """Aggiunge tabella Strengths & Weaknesses"""
        processes_radar = stats_data.get('processes_radar', [])
        
        if not processes_radar:
            return
        
        # Titolo
        y_pos = self.page_height - self.margin_top
        c.setFont('Helvetica-Bold', 18)
        c.setFillColor(colors.HexColor('#2C3E50'))
        c.drawString(self.margin_left, y_pos, "STRENGTHS & WEAKNESSES BY PROCESS")
        
        y_pos -= 1.5*cm
        
        # Intestazioni tabella
        col_widths = [8*cm, 2.5*cm, 2.5*cm, 2.5*cm, 2.5*cm]
        headers = ['Process', 'Governance', 'M&C', 'Technology', 'Organization']
        
        # Disegna header
        c.setFont('Helvetica-Bold', 10)
        c.setFillColor(colors.white)
        
        # Background header
        c.setFillColor(colors.HexColor('#3DBFBF'))
        c.rect(self.margin_left, y_pos - 0.5*cm, sum(col_widths), 0.8*cm, fill=1)
        
        c.setFillColor(colors.white)
        x_pos = self.margin_left + 0.2*cm
        for i, header in enumerate(headers):
            c.drawString(x_pos, y_pos - 0.3*cm, header)
            x_pos += col_widths[i]
        
        y_pos -= 1*cm
        
        # Righe dati
        c.setFont('Helvetica', 9)
        
        for idx, process_data in enumerate(processes_radar):
            if y_pos < 3*cm:
                break
            
            process_name = process_data.get('process', '')
            dims = process_data.get('dimensions', {})
            overall = process_data.get('overall_score', 0)
            
            # Colore riga alternato
            if idx % 2 == 0:
                c.setFillColor(colors.HexColor('#F8F9FA'))
                c.rect(self.margin_left, y_pos - 0.4*cm, sum(col_widths), 0.7*cm, fill=1)
            
            c.setFillColor(colors.HexColor('#333333'))
            
            # Nome processo
            x_pos = self.margin_left + 0.2*cm
            c.drawString(x_pos, y_pos - 0.2*cm, process_name[:30])
            x_pos += col_widths[0]
            
            # Valori dimensioni con colore
            dim_values = [
                dims.get('governance', 0),
                dims.get('monitoring_control', 0),
                dims.get('technology', 0),
                dims.get('organization', 0)
            ]
            
            for val in dim_values:
                # Colore basato sul valore
                if val >= 3.5:
                    c.setFillColor(colors.HexColor('#10B981'))  # Verde
                elif val >= 2.5:
                    c.setFillColor(colors.HexColor('#F59E0B'))  # Arancione
                else:
                    c.setFillColor(colors.HexColor('#EF4444'))  # Rosso
                
                c.drawString(x_pos + 0.8*cm, y_pos - 0.2*cm, f"{val:.2f}")
                x_pos += col_widths[1]
            
            y_pos -= 0.7*cm
        
        # Linee griglia
        c.setStrokeColor(colors.HexColor('#E5E7EB'))
        c.setLineWidth(0.5)
        
        # Linee verticali
        x_pos = self.margin_left
        for width in col_widths:
            c.line(x_pos, self.page_height - self.margin_top - 1*cm, x_pos, y_pos + 0.3*cm)
            x_pos += width
        c.line(x_pos, self.page_height - self.margin_top - 1*cm, x_pos, y_pos + 0.3*cm)

    def _add_all_process_radars(self, c: canvas.Canvas, stats_data: Dict):
        """Aggiunge tutti i radar singoli piccoli in una griglia"""
        processes_radar = stats_data.get('processes_radar', [])
        
        if not processes_radar:
            return
        
        # Titolo
        y_pos = self.page_height - self.margin_top
        c.setFont('Helvetica-Bold', 18)
        c.setFillColor(colors.HexColor('#2C3E50'))
        c.drawString(self.margin_left, y_pos, "RADAR PER PROCESSO")
        
        # Griglia 3x3 per i radar
        radar_size = 5*cm
        cols = 3
        rows = 3
        x_start = self.margin_left
        y_start = self.page_height - self.margin_top - 2*cm
        
        for idx, process_data in enumerate(processes_radar[:9]):  # Max 9 processi
            col = idx % cols
            row = idx // cols
            
            x_pos = x_start + col * (radar_size + 0.5*cm)
            y_pos = y_start - row * (radar_size + 1.5*cm)
            
            # Crea mini radar
            self._draw_mini_radar(c, process_data, x_pos, y_pos, radar_size)

    def _draw_mini_radar(self, c: canvas.Canvas, process_data: Dict, x: float, y: float, size: float):
        """Disegna un mini radar chart per un singolo processo"""
        dims = process_data.get('dimensions', {})
        process_name = process_data.get('process', '')[:20]
        overall = process_data.get('overall_score', 0)
        
        # Crea figura piccola
        fig, ax = plt.subplots(figsize=(2.5, 2.5), subplot_kw=dict(projection='polar'))
        
        dimensions = ['Gov', 'M&C', 'Tech', 'Org']
        values = [
            dims.get('governance', 0),
            dims.get('monitoring_control', 0),
            dims.get('technology', 0),
            dims.get('organization', 0)
        ]
        
        num_dims = len(dimensions)
        angles = np.linspace(0, 2 * np.pi, num_dims, endpoint=False).tolist()
        values += values[:1]
        angles += angles[:1]
        
        ax.plot(angles, values, 'o-', linewidth=1.5, color='#F39C12', markersize=3)
        ax.fill(angles, values, alpha=0.25, color='#F39C12')
        
        ax.set_xticks(angles[:-1])
        ax.set_xticklabels(dimensions, size=6)
        ax.set_ylim(0, 5)
        ax.set_yticks([1, 2, 3, 4, 5])
        ax.set_yticklabels(['', '', '', '', ''], size=5)
        ax.grid(True, alpha=0.3)
        
        plt.title(f'{process_name}\n({overall:.2f})', size=8, weight='bold', y=1.05)
        
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=100, bbox_inches='tight')
        plt.close()
        img_buffer.seek(0)
        
        from reportlab.lib.utils import ImageReader
        img = ImageReader(img_buffer)
        c.drawImage(img, x, y - size, width=size, height=size)

    def _add_ai_conclusions(self, c: canvas.Canvas, ai_conclusions: str):
        """Aggiunge le conclusioni AI"""
        y_pos = self.page_height - self.margin_top
        
        c.setFont('Helvetica-Bold', 18)
        c.setFillColor(colors.HexColor('#2C3E50'))
        c.drawString(self.margin_left, y_pos, "CONCLUSIONI E RACCOMANDAZIONI AI")
        
        y_pos -= 1.5*cm
        c.setFont('Helvetica', 10)
        c.setFillColor(colors.HexColor('#333333'))
        
        # Wrapping del testo
        lines = ai_conclusions.split('\n')
        line_height = 12
        max_width = self.content_width
        
        for line in lines:
            if y_pos < self.margin_bottom + 2*cm:
                break
            
            # Se la linea è vuota, solo spaziatura
            if not line.strip():
                y_pos -= line_height
                continue
            
            # Word wrap
            words = line.split()
            current_line = ""
            
            for word in words:
                test_line = current_line + " " + word if current_line else word
                if c.stringWidth(test_line, 'Helvetica', 10) < max_width:
                    current_line = test_line
                else:
                    if current_line:
                        c.drawString(self.margin_left, y_pos, current_line)
                        y_pos -= line_height
                    current_line = word
            
            if current_line:
                c.drawString(self.margin_left, y_pos, current_line)
                y_pos -= line_height
