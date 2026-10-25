import type { IllustrationName } from '../components/Illustration';
import type { ExamGroupId } from '../types/firestore';

/**
 * Icons for the 7 exam groups in the header's Courses menu (the groups and their exams come from Firestore
 * `examGroups`; short menu labels live in nav.courseMenu.groups.<id>).
 */
export const examGroupIcons: Record<ExamGroupId, IllustrationName> = {
  ssc: 'book3d',
  railway: 'train3d',
  banking: 'bank3d',
  upsc: 'gradCap',
  state: 'dome3d',
  defence: 'armyHelmet',
  paramilitary: 'policeCap',
};
