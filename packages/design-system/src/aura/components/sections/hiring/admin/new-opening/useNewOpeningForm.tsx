import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import dayjs from 'dayjs';
import * as yup from 'yup';
import {
  type ApplicationDetailsFormValues,
  applicationDetailsSchema,
} from './steps/ApplicationDetails';
import { type HiringTeamFormValues, hiringTeamSchema } from './steps/HiringTeam';
import { type JobBoardFormValues, jobBoardSchema } from './steps/JobBoard';
import { type JobInformationFormValues, jobInformationFormSchema } from './steps/JobInformation';

export interface NewOpeningFormValues
  extends JobInformationFormValues,
    ApplicationDetailsFormValues,
    HiringTeamFormValues,
    JobBoardFormValues {}

const newOpeningFormSchema = [
  jobInformationFormSchema,
  applicationDetailsSchema,
  null,
  hiringTeamSchema,
  jobBoardSchema,
] as yup.ObjectSchema<NewOpeningFormValues>[];

const useNewOpeningForm = (activeStep: number) => {
  const methods = useForm<NewOpeningFormValues>({
    resolver: newOpeningFormSchema[activeStep]
      ? yupResolver(newOpeningFormSchema[activeStep])
      : undefined,
    defaultValues: {
      jobInformation,
      candidateData,
      options,
      hiringManager,
      teamMember,
      boards,
    },
  });

  return methods;
};

export default useNewOpeningForm;

// Default values
const jobInformation: Partial<JobInformationFormValues['jobInformation']> = {
  jobTitle: '',
  positionNumber: 1,
  department: 'Support',
  hiringLead: 'Michael Hall',
  branch: 'UK',
  experience: 1,
  deadline: dayjs().format(),
  compensation: {
    currency: 'AUD',
    salary: 1800,
    interval: 'weekly',
  },
};

const candidateData: Partial<ApplicationDetailsFormValues['candidateData']> = {
  name: true,
  email: true,
  phoneNo: true,
};

const options: Partial<ApplicationDetailsFormValues['options']> = {
  image: 'required',
  address: 'optional',
  referredBy: 'disabled',
  desiredSalary: 'required',
  resume: 'required',
  coverLetter: 'optional',
  websitePortfolio: 'optional',
  education: 'required',
  workExperience: 'required',
};

const hiringManager: Partial<HiringTeamFormValues['hiringManager']> = {
  employee: 'Jack Smith',
  department: 'Data & Analytics',
};
const teamMember: Partial<HiringTeamFormValues['teamMember']> = [
  {
    employee: 'Michael Hall',
    department: 'Support',
  },
  {
    employee: 'Grace Wong',
    department: 'Sales',
  },
];
const boards: Partial<JobBoardFormValues['boards']> = {
  linkedIn: true,
  indeed: false,
  facebook: false,
};
