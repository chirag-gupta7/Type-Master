import { redirect } from 'next/navigation';

export default function NormalLearnPage() {
  redirect('/learn?practice=normal');
}
