import React from 'react';
import {
  HeartPulse,
  Briefcase,
  Construction,
  Tractor,
  GraduationCap,
  Trophy,
  Palette,
  Sparkles,
  Shield,
  MoreHorizontal,
} from 'lucide-react';
import { PriorityKey } from '../types';

interface Props {
  name: PriorityKey | string;
  className?: string;
}

export const getPriorityColor = (name: string): string => {
  switch (name) {
    case 'Saúde':
      return '#059669'; // Green
    case 'Emprego e geração de renda':
      return '#0d9488'; // Teal
    case 'Infraestrutura e mobilidade':
      return '#d97706'; // Amber/Orange
    case 'Zona rural e produção':
      return '#854d0e'; // Olive/Brown
    case 'Educação e qualificação':
    case 'Educação e qualificação profissional':
      return '#2563eb'; // Blue
    case 'Esporte e lazer':
      return '#e11d48'; // Rose/Red
    case 'Cultura e turismo':
      return '#9333ea'; // Purple
    case 'Juventude':
    case 'Juventude e oportunidades':
      return '#4f46e5'; // Indigo
    case 'Segurança':
      return '#475569'; // Slate
    default:
      return '#1e293b'; // Dark Gray
  }
};

export const PriorityIcon: React.FC<Props> = ({ name, className = 'w-4 h-4' }) => {
  switch (name) {
    case 'Saúde':
      return <HeartPulse className={`${className} text-emerald-600`} />;
    case 'Emprego e geração de renda':
      return <Briefcase className={`${className} text-teal-600`} />;
    case 'Infraestrutura e mobilidade':
      return <Construction className={`${className} text-amber-600`} />;
    case 'Zona rural e produção':
      return <Tractor className={`${className} text-lime-700`} />;
    case 'Educação e qualificação':
    case 'Educação e qualificação profissional':
      return <GraduationCap className={`${className} text-blue-600`} />;
    case 'Esporte e lazer':
      return <Trophy className={`${className} text-rose-600`} />;
    case 'Cultura e turismo':
      return <Palette className={`${className} text-purple-600`} />;
    case 'Juventude':
    case 'Juventude e oportunidades':
      return <Sparkles className={`${className} text-indigo-600`} />;
    case 'Segurança':
      return <Shield className={`${className} text-slate-600`} />;
    default:
      return <MoreHorizontal className={`${className} text-slate-500`} />;
  }
};
