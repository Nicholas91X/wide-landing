import { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";
import { trackBookingStart } from "../utils/analytics";

interface CalEmbedProps {
  calLink: string;
  eventSlug: string;
  domain?: string;
  buttonText?: string;
  subText?: string;
}

export const CalEmbed = ({ calLink, eventSlug, domain = "cal.com", buttonText = "Prenota una call", subText = "Fissa un incontro gratuito di 30 minuti con il nostro team." }: CalEmbedProps) => {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ embedJsUrl: `https://${domain}/embed/embed.js` });
      cal("ui", {
        styles: { branding: { brandColor: "#000000" } },
        hideEventTypeDetails: false,
        layout: "month_view"
      });
    })();
  }, [calLink, eventSlug, domain]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: '20px 0' }}>
      <h3 style={{ 
        color: '#fff', 
        fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', 
        fontWeight: 600, 
        marginBottom: '12px',
        letterSpacing: '-0.02em',
        textAlign: 'center'
      }}>
        Inizia il tuo progetto
      </h3>
      <p style={{
        color: 'rgba(255, 255, 255, 0.65)',
        fontSize: '0.9rem',
        marginBottom: '36px',
        textAlign: 'center',
        maxWidth: '85%',
        lineHeight: 1.5
      }}>
        {subText}
      </p>
      <button
        data-cal-link={`${calLink}/${eventSlug}`}
        data-cal-config='{"layout":"month_view"}'
        onClick={() => trackBookingStart()}
        style={{
          backgroundColor: '#fff',
          color: '#000',
          padding: '16px 40px',
          fontSize: '0.95rem',
          fontWeight: 600,
          border: 'none',
          borderRadius: '30px',
          cursor: 'pointer',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 4px 20px rgba(255, 255, 255, 0.15)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(255, 255, 255, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 255, 255, 0.15)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translateY(1px)';
          e.currentTarget.style.boxShadow = '0 2px 10px rgba(255, 255, 255, 0.1)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(255, 255, 255, 0.25)';
        }}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default CalEmbed;
