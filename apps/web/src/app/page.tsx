import { Chat } from './features/chat/chat';
import styles from './page.module.css';

export default function Page() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.hero}>
          <div className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 8.25h10M8.25 4.75h7.5c2.9 0 5.25 2.35 5.25 5.25v3.5c0 2.9-2.35 5.25-5.25 5.25h-3.42L8.4 21.4a.75.75 0 0 1-1.17-.62v-2.1A5.25 5.25 0 0 1 3 13.5V10c0-2.9 2.35-5.25 5.25-5.25Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="m14.4 10.8.46 1.06 1.06.46-1.06.46-.46 1.06-.46-1.06-1.06-.46 1.06-.46.46-1.06Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span>
              <strong>Commerce Care</strong>
              <small>AI Support Assistant</small>
            </span>
          </div>

          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>
              <span aria-hidden="true" />
              Support that never sleeps
            </p>
            <h1>
              Every shopper deserves a <span>helpful answer.</span>
            </h1>
            <p className={styles.summary}>
              Fast, thoughtful support for product questions, orders, shipping,
              and returns—all in one friendly conversation.
            </p>
            <div className={styles.benefits} aria-label="Assistant benefits">
              <span>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m4 8 2.4 2.4L12 4.8" />
                </svg>
                Instant answers
              </span>
              <span>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m4 8 2.4 2.4L12 4.8" />
                </svg>
                Available 24/7
              </span>
            </div>
          </div>

          <div className={styles.insightCard}>
            <div className={styles.insightIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 3 4.5 6v5.4c0 4.65 3.2 8.98 7.5 10.1 4.3-1.12 7.5-5.45 7.5-10.1V6L12 3Z" />
                <path d="m8.6 12 2.1 2.1 4.7-4.7" />
              </svg>
            </div>
            <div>
              <strong>Private by design</strong>
              <p>Your API key stays safely on the server.</p>
            </div>
          </div>
        </aside>

        <section className={styles.workspace} aria-label="Support workspace">
          <Chat />
        </section>
      </div>
    </main>
  );
}
