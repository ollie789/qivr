// Anatomical region mapping for 3D body model
export interface AnatomicalRegion {
  meshName: string;
  displayName: string;
  category: 'head' | 'neck' | 'torso' | 'upper_limb' | 'lower_limb';
  side?: 'left' | 'right' | 'bilateral';
  snomedCode?: string;
}

export const ANATOMICAL_REGIONS: AnatomicalRegion[] = [
  // Head & Neck
  { meshName: 'back_head', displayName: 'Back of Head', category: 'head', snomedCode: '69536005' },
  { meshName: 'front_head', displayName: 'Front of Head', category: 'head', snomedCode: '69536005' },
  { meshName: 'back_neck', displayName: 'Back of Neck', category: 'neck', snomedCode: '123958008' },
  { meshName: 'front_neck', displayName: 'Front of Neck', category: 'neck', snomedCode: '123958008' },

  // Back - Left
  { meshName: 'back_left_buttocks', displayName: 'Left Buttock', category: 'torso', side: 'left', snomedCode: '46862004' },
  { meshName: 'back_left_foot', displayName: 'Left Foot (Back)', category: 'lower_limb', side: 'left', snomedCode: '56459004' },
  { meshName: 'back_left_knee', displayName: 'Left Knee (Back)', category: 'lower_limb', side: 'left', snomedCode: '72696002' },
  { meshName: 'back_left_lower_arm', displayName: 'Left Forearm (Back)', category: 'upper_limb', side: 'left', snomedCode: '14975008' },
  { meshName: 'back_left_lower_back', displayName: 'Left Lower Back', category: 'torso', side: 'left', snomedCode: '37822005' },
  { meshName: 'back_left_mid_back', displayName: 'Left Mid Back', category: 'torso', side: 'left', snomedCode: '123946008' },
  { meshName: 'back_left_shin', displayName: 'Left Shin (Back)', category: 'lower_limb', side: 'left', snomedCode: '12611008' },
  { meshName: 'back_left_shoulder', displayName: 'Left Shoulder (Back)', category: 'upper_limb', side: 'left', snomedCode: '16982005' },
  { meshName: 'back_left_thigh', displayName: 'Left Thigh (Back)', category: 'lower_limb', side: 'left', snomedCode: '68367000' },
  { meshName: 'back_left_upper_arm', displayName: 'Left Upper Arm (Back)', category: 'upper_limb', side: 'left', snomedCode: '40983000' },
  { meshName: 'back_left_upper_back', displayName: 'Left Upper Back', category: 'torso', side: 'left', snomedCode: '123946008' },

  // Back - Right
  { meshName: 'back_right_buttocks', displayName: 'Right Buttock', category: 'torso', side: 'right', snomedCode: '46862004' },
  { meshName: 'back_right_foot', displayName: 'Right Foot (Back)', category: 'lower_limb', side: 'right', snomedCode: '56459004' },
  { meshName: 'back_right_knee', displayName: 'Right Knee (Back)', category: 'lower_limb', side: 'right', snomedCode: '72696002' },
  { meshName: 'back_right_lower_arm', displayName: 'Right Forearm (Back)', category: 'upper_limb', side: 'right', snomedCode: '14975008' },
  { meshName: 'back_right_lower_back', displayName: 'Right Lower Back', category: 'torso', side: 'right', snomedCode: '37822005' },
  { meshName: 'back_right_mid_back', displayName: 'Right Mid Back', category: 'torso', side: 'right', snomedCode: '123946008' },
  { meshName: 'back_right_shin', displayName: 'Right Shin (Back)', category: 'lower_limb', side: 'right', snomedCode: '12611008' },
  { meshName: 'back_right_shoulder', displayName: 'Right Shoulder (Back)', category: 'upper_limb', side: 'right', snomedCode: '16982005' },
  { meshName: 'back_right_thigh', displayName: 'Right Thigh (Back)', category: 'lower_limb', side: 'right', snomedCode: '68367000' },
  { meshName: 'back_right_upper_arm', displayName: 'Right Upper Arm (Back)', category: 'upper_limb', side: 'right', snomedCode: '40983000' },
  { meshName: 'back_right_upper_back', displayName: 'Right Upper Back', category: 'torso', side: 'right', snomedCode: '123946008' },

  // Front - Left
  { meshName: 'front_left_foot', displayName: 'Left Foot (Front)', category: 'lower_limb', side: 'left', snomedCode: '56459004' },
  { meshName: 'front_left_hand', displayName: 'Left Hand', category: 'upper_limb', side: 'left', snomedCode: '85562004' },
  { meshName: 'front_left_knee', displayName: 'Left Knee (Front)', category: 'lower_limb', side: 'left', snomedCode: '72696002' },
  { meshName: 'front_left_lower_abdomen', displayName: 'Left Lower Abdomen', category: 'torso', side: 'left', snomedCode: '27949001' },
  { meshName: 'front_left_lower_arm', displayName: 'Left Forearm (Front)', category: 'upper_limb', side: 'left', snomedCode: '14975008' },
  { meshName: 'front_left_lower_chest', displayName: 'Left Lower Chest', category: 'torso', side: 'left', snomedCode: '78904004' },
  { meshName: 'front_left_pelvis', displayName: 'Left Pelvis', category: 'torso', side: 'left', snomedCode: '12921003' },
  { meshName: 'front_left_shoulder', displayName: 'Left Shoulder (Front)', category: 'upper_limb', side: 'left', snomedCode: '16982005' },
  { meshName: 'front_left_shin', displayName: 'Left Shin (Front)', category: 'lower_limb', side: 'left', snomedCode: '12611008' },
  { meshName: 'front_left_thigh', displayName: 'Left Thigh (Front)', category: 'lower_limb', side: 'left', snomedCode: '68367000' },
  { meshName: 'front_left_upper_abdomen', displayName: 'Left Upper Abdomen', category: 'torso', side: 'left', snomedCode: '27949001' },
  { meshName: 'front_left_upper_arm', displayName: 'Left Upper Arm (Front)', category: 'upper_limb', side: 'left', snomedCode: '40983000' },
  { meshName: 'front_left_upper_chest', displayName: 'Left Upper Chest', category: 'torso', side: 'left', snomedCode: '78904004' },

  // Front - Right
  { meshName: 'front_right_foot', displayName: 'Right Foot (Front)', category: 'lower_limb', side: 'right', snomedCode: '56459004' },
  { meshName: 'front_right_hand', displayName: 'Right Hand', category: 'upper_limb', side: 'right', snomedCode: '85562004' },
  { meshName: 'front_right_knee', displayName: 'Right Knee (Front)', category: 'lower_limb', side: 'right', snomedCode: '72696002' },
  { meshName: 'front_right_lower_abdomen', displayName: 'Right Lower Abdomen', category: 'torso', side: 'right', snomedCode: '27949001' },
  { meshName: 'front_right_lower_arm', displayName: 'Right Forearm (Front)', category: 'upper_limb', side: 'right', snomedCode: '14975008' },
  { meshName: 'front_right_lower_chest', displayName: 'Right Lower Chest', category: 'torso', side: 'right', snomedCode: '78904004' },
  { meshName: 'front_right_pelvis', displayName: 'Right Pelvis', category: 'torso', side: 'right', snomedCode: '12921003' },
  { meshName: 'front_right_shoulder', displayName: 'Right Shoulder (Front)', category: 'upper_limb', side: 'right', snomedCode: '16982005' },
  { meshName: 'front_right_shin', displayName: 'Right Shin (Front)', category: 'lower_limb', side: 'right', snomedCode: '12611008' },
  { meshName: 'front_right_thigh', displayName: 'Right Thigh (Front)', category: 'lower_limb', side: 'right', snomedCode: '68367000' },
  { meshName: 'front_right_upper_abdomen', displayName: 'Right Upper Abdomen', category: 'torso', side: 'right', snomedCode: '27949001' },
  { meshName: 'front_right_upper_arm', displayName: 'Right Upper Arm (Front)', category: 'upper_limb', side: 'right', snomedCode: '40983000' },
  { meshName: 'front_right_upper_chest', displayName: 'Right Upper Chest', category: 'torso', side: 'right', snomedCode: '78904004' },
];

export function getRegionDisplayName(meshName: string): string {
  const region = ANATOMICAL_REGIONS.find(r => r.meshName === meshName);
  return region?.displayName || meshName;
}

export function getRegionSnomedCode(meshName: string): string | undefined {
  const region = ANATOMICAL_REGIONS.find(r => r.meshName === meshName);
  return region?.snomedCode;
}
