import styles from './page.module.css';

export default function Page() {
  return (
    <main className={styles.page}>
      <section className={styles.introduction}>
        <p className={styles.eyebrow}>Milestone 0</p>
        <h1>E-commerce AI Support Assistant</h1>
        <p className={styles.summary}>
          The Next.js frontend and NestJS API foundation is ready. Chat,
          retrieval, and tool integrations will be introduced incrementally.
        </p>
      </section>
    </main>
  );
}
