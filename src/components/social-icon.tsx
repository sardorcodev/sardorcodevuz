import { Icon } from "./icon";

/** The published URL identifies the platform, even if its CMS title is renamed. */
export function SocialIcon({ href }: { href: string }) {
  const host = new URL(href).hostname.replace(/^www\./, "");
  let path;
  if (host === "x.com" || host === "twitter.com") {
    path = (
      <path d="M18.8 2H22l-7 8 8.2 12h-6.4l-5-7.3L5.4 22H2l7.8-9L2 2h6.6l4.6 6.7ZM17.8 20h1.8L7.7 4H5.8Z" />
    );
  } else if (host === "youtube.com" || host === "youtu.be") {
    path = (
      <>
        <rect x="1" y="4" width="22" height="16" rx="5" />
        <path d="m10 8 6 4-6 4Z" fill="var(--bg)" />
      </>
    );
  } else if (host === "linkedin.com") {
    path = (
      <>
        <rect x="1" y="1" width="22" height="22" rx="2" />
        <circle cx="6" cy="6" r="1.6" fill="var(--bg)" />
        <path
          d="M4.5 9h3v10h-3Zm5 0h3v1.4c.7-1 1.7-1.7 3.2-1.7 3 0 3.8 2 3.8 4.8V19h-3v-5.2c0-1.4-.3-2.6-1.9-2.6-1.8 0-2.1 1.3-2.1 2.7V19h-3Z"
          fill="var(--bg)"
        />
      </>
    );
  } else if (host === "facebook.com") {
    path = (
      <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7V12h3.1V9.3c0-3.1 1.8-4.8 4.6-4.8 1.4 0 2.8.3 2.8.3v3h-1.6c-1.6 0-2.1 1-2.1 2V12h3.5l-.6 3.5h-2.9v8.4A12 12 0 0 0 24 12Z" />
    );
  } else if (host === "instagram.com") {
    return (
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="20" height="20" rx="6" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  } else if (host === "github.com") {
    path = (
      <path d="M12 .9a11.1 11.1 0 0 0-3.5 21.6c.6.1.8-.2.8-.5v-2.1c-3.3.7-4-1.4-4-1.4-.5-1.3-1.3-1.6-1.3-1.6-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.8 1.4 3.4 1 .1-.8.4-1.4.8-1.7-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2V22c0 .3.2.6.8.5A11.1 11.1 0 0 0 12 .9Z" />
    );
  } else if (host === "t.me" || host === "telegram.me") {
    path = (
      <path d="m21.7 3.5-3.3 16.2c-.3 1.2-.9 1.5-1.9.9l-5-3.7-2.4 2.4c-.3.3-.5.5-1 .5l.4-5.1L17.7 6c.4-.4-.1-.6-.6-.3L5.4 13.1 1 11.7c-.9-.3-1-1 .2-1.4l18.5-7.1c.9-.3 1.7.2 1.4 1.3Z" />
    );
  } else {
    return <Icon name="globe" />;
  }
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
      {path}
    </svg>
  );
}
