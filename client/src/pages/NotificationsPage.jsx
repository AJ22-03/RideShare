import Card from '../components/Card';

export default function NotificationsPage() {
  return (
    <div className="page container">
      <h1>Notifications</h1>
      <Card title="Inbox" subtitle="Ride, payment and trip alerts." style={{ marginTop: '1.5rem' }}>
        <p>No new notifications yet.</p>
      </Card>
    </div>
  );
}
