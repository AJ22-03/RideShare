import Button from '../components/Button';
import Card from '../components/Card';

export default function BookRidePage() {
  return (
    <div className="page container">
      <h1>Book a ride</h1>
      <div className="grid-2" style={{ marginTop: '1.5rem' }}>
        <Card title="Search route" subtitle="Find the best matching ride for your segment.">
          <div className="form-grid">
            <div className="field">
              <label>Pickup</label>
              <input type="text" defaultValue="Satara" />
            </div>
            <div className="field">
              <label>Drop</label>
              <input type="text" defaultValue="Pune" />
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" defaultValue="2026-10-15" />
            </div>
            <Button>Search rides</Button>
          </div>
        </Card>

        <Card title="Matching rides" subtitle="Results shown with route, fare and stop details.">
          <p>Ride results placeholder.</p>
        </Card>
      </div>
    </div>
  );
}
