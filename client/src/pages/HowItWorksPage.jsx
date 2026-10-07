import Card from '../components/Card';

const steps = [
  { title: '1. Search a route', text: 'Pick your pickup, destination and travel date to find rides near your trip.' },
  { title: '2. Book or accept', text: 'Riders request a lift or drivers publish the trip and match riders along the route.' },
  { title: '3. Ride and pay', text: 'Trip happens in real time, with secure payment and status updates for everyone.' }
];

export default function HowItWorksPage() {
  return (
    <div className="container page">
      <h1>How it works</h1>
      <div className="grid-3" style={{ marginTop: '1.5rem' }}>
        {steps.map((step) => (
          <Card key={step.title} title={step.title} subtitle={step.text} />
        ))}
      </div>
    </div>
  );
}
