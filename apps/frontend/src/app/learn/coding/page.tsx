import { redirect } from 'next/navigation';

export default function CodingLearnPage() {
  redirect('/learn?practice=coding');
}
