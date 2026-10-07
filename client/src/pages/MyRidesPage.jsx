import Card from '../components/Card';

export default function MyRidesPage() {
  return (
    <div className="page container">
      <h1>My rides</h1>
      <div className="grid-3" style={{ marginTop: '1.5rem' }}>
        <Card title="Upcoming" subtitle="Trips confirmed and ready to go." />
        <Card title="Ongoing" subtitle="Live rides in progress." />
        <Card title="Past" subtitle="Completed rides and receipts." />
      </div>
    </div>
  );
}
