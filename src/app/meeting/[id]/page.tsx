import { MeetingDetailLoader } from '@/domains/meetings/components/organisms/meeting-detail-loader';

type MeetingPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MeetingPage({ params }: MeetingPageProps) {
  const { id } = await params;
  return <MeetingDetailLoader id={id} />;
}
