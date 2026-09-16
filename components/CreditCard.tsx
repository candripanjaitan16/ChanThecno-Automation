export default function CreditCard({ balance }: { balance: number }) {
  return (
    <div className="rounded-2xl p-8 bg-gradient-to-br from-purple/40 to-purple-dark/60 border border-purple/30">
      <div className="text-xs tracking-widest text-white/60 text-center mb-2">
        SALDO CREDIT
      </div>
      <div className="text-4xl font-bold text-center">
        {balance.toFixed(4)}
      </div>
    </div>
  );
}
