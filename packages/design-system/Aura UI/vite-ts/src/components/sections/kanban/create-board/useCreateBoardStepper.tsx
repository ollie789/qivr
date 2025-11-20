import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useTheme } from '@mui/material';
import {
  backgroundColorOptions,
  backgroundImageOptions,
  initialTeamTableData,
} from 'data/kanban/createBoard';
import * as yup from 'yup';
import {
  BackgroundOptionFormValues,
  backgroundOptionFormSchema,
} from 'components/sections/kanban/create-board/steps/Background/Background';
import {
  BasicInfoFormValues,
  basicInfoFormSchema,
} from 'components/sections/kanban/create-board/steps/BasicInfo';
import {
  ColumnInfoFormValues,
  columnInfoSchema,
} from 'components/sections/kanban/create-board/steps/ColumnStage/ColumnStage';
import {
  LabelInfoFormValues,
  labelInfoFormSchema,
} from 'components/sections/kanban/create-board/steps/LabelInfo';
import {
  NewTeamFormValues,
  newTeamFormSchema,
} from 'components/sections/kanban/create-board/steps/TeamInvite/NewTeamTabPanel';

export type CreateBoardFormValues = BasicInfoFormValues &
  ColumnInfoFormValues &
  LabelInfoFormValues &
  NewTeamFormValues &
  BackgroundOptionFormValues;

const validationSchemas = [
  basicInfoFormSchema,
  columnInfoSchema,
  backgroundOptionFormSchema,
  labelInfoFormSchema,
  newTeamFormSchema,
];

const useCreateBoardForm = (activeStep: number) => {
  const { palette } = useTheme();
  const methods = useForm<CreateBoardFormValues>({
    resolver: yupResolver(validationSchemas[activeStep] as yup.ObjectSchema<CreateBoardFormValues>),
    defaultValues: {
      name: '',
      boardType: '',
      visibility: 'private',
      columns: [
        { columnType: 'To Do', color: palette.success.lighter, cardLimit: 20, hasCardLimit: true },
        {
          columnType: 'Completed',
          color: palette.primary.lighter,
          cardLimit: 20,
          hasCardLimit: true,
        },
        {
          columnType: 'Ongoing',
          color: palette.warning.lighter,
          cardLimit: 20,
          hasCardLimit: true,
        },
      ],
      backgroundOptions: {
        colors: backgroundColorOptions,
        images: backgroundImageOptions,
        selected: { ...backgroundImageOptions[0], type: 'image' },
      },
      labels: [
        { label: 'Todo', color: palette.success.lighter },
        { label: 'Completed', color: palette.primary.lighter },
        { label: 'Ongoing', color: palette.warning.lighter },
      ],
      team: initialTeamTableData,
    },
  });

  return methods;
};

export default useCreateBoardForm;
