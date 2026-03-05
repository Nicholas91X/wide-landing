import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

interface CalEmbedProps {
  calLink: string;
  eventSlug: string;
  domain?: string;
}

export const CalEmbed = ({ calLink, eventSlug, domain = "cal.com" }: CalEmbedProps) => {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ embedJsUrl: `https://${domain}/embed/embed.js` });
      cal("ui", {
        styles: { branding: { brandColor: "#000000" } },
        hideEventTypeDetails: false,
        layout: "month_view"
      });
    })();
  }, [domain]);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "450px" }}>
      <Cal 
        calLink={`${calLink}/${eventSlug}`}
        style={{ width: "100%", height: "100%", overflow: "scroll" }}
        config={{ layout: "month_view" }}
        embedJsUrl={`https://${domain}/embed/embed.js`}
      />
    </div>
  );
};

export default CalEmbed;
