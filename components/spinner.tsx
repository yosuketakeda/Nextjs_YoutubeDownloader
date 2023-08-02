import styles from '../src/styles/Spinner.module.css';

export default function Spinner() {
  return (
    <div className="spinner-container">
      <div className={styles.loadingSpinner}>
      </div>
    </div>
  );
}