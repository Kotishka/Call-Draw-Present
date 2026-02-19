import React, { useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import html2canvas from 'html2canvas';

export default function ExportButton({ targetRef, filename, label, variant = 'outline-secondary', size = 'sm' }) {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        if (!targetRef || !targetRef.current) return;
        setExporting(true);
        try {
            const canvas = await html2canvas(targetRef.current, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: false,
                logging: false
            });
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setExporting(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleExport}
            disabled={exporting}
        >
            {exporting
                ? <><Spinner animation="border" size="sm" className="me-1" />Exporting...</>
                : <>📥 {label}</>
            }
        </Button>
    );
}
