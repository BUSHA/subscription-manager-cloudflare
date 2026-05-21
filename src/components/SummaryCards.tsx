import { CalendarDays, CircleDollarSign, ListChecks } from "lucide-react";

type Props = {
  monthlyTotal: string;
  yearlyTotal: string;
  activeCount: number;
};

export function SummaryCards({ monthlyTotal, yearlyTotal, activeCount }: Props) {
  return (
    <section className="summary-grid" aria-label="Subscription summary">
      <article className="summary-card">
        <CircleDollarSign size={22} />
        <span>Monthly</span>
        <strong>{monthlyTotal}</strong>
      </article>
      <article className="summary-card">
        <CalendarDays size={22} />
        <span>Yearly</span>
        <strong>{yearlyTotal}</strong>
      </article>
      <article className="summary-card">
        <ListChecks size={22} />
        <span>Active</span>
        <strong>{activeCount}</strong>
      </article>
    </section>
  );
}
