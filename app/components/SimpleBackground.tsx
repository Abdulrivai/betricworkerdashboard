// app/components/SimpleBackground.tsx
'use client';

export default function SimpleBackground() {
  // Static particles dengan posisi tetap
  const staticParticles = [
    { left: '10%', top: '20%', delay: '0s', duration: '3s' },
    { left: '25%', top: '60%', delay: '0.5s', duration: '2.5s' },
    { left: '45%', top: '30%', delay: '1s', duration: '3.5s' },
    { left: '65%', top: '70%', delay: '1.5s', duration: '2s' },
    { left: '80%', top: '15%', delay: '2s', duration: '4s' },
    { left: '15%', top: '80%', delay: '0.3s', duration: '3.2s' },
    { left: '90%', top: '50%', delay: '1.8s', duration: '2.8s' },
    { left: '35%', top: '10%', delay: '2.3s', duration: '3.7s' },
    { left: '70%', top: '40%', delay: '0.8s', duration: '2.3s' },
    { left: '55%', top: '85%', delay: '1.3s', duration: '3.1s' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-black/40 to-cyan-900/20"></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-cyan-900/5 to-blue-900/10"></div>
      
      {/* Static particles */}
      <div className="absolute inset-0">
        {staticParticles.map((particle, index) => (
          <div
            key={index}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-40 animate-ping"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>
      
      {/* Additional visual effects */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-green-500/5 rounded-full blur-lg transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>
    </div>
  );
}