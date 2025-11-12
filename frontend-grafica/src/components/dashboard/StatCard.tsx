// src/components/dashboard/StatCard.tsx

import { LucideProps } from "lucide-react"; // Para tipar o ícone
import { ComponentType } from "react";

type StatCardProps = {
  title: string;
  value: string;
  Icon: ComponentType<LucideProps>;
  color: 'blue' | 'red' | 'green' | 'orange';
};

// Mapeamento de cores para as classes do Tailwind CSS
const colorClasses = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-600',
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-600',
  },
};

export default function StatCard({ title, value, Icon, color }: StatCardProps) {
  const classes = colorClasses[color];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-6">
      <div className={`flex items-center justify-center h-12 w-12 rounded-full ${classes.bg}`}>
        <Icon className={`h-6 w-6 ${classes.text}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}