import WeekReportClient from './WeekReportClient'

interface Props {
  params: Promise<{ weekStart: string }>
}

export default async function WeekReportPage({ params }: Props) {
  const { weekStart } = await params
  return <WeekReportClient weekStart={weekStart} />
}
