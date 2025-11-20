import { PropsWithChildren, createContext, use } from 'react';
import { personalInfoData } from 'data/account/personal-info';
import { billingAddressData, shippingAddressData } from 'data/account/shipping-billing-address';
import { backupSyncSettings, storageData } from 'data/account/storage';
import { globalPermissions, userPermissions } from 'data/account/user-permissions';
import { educationHistory, workHistory } from 'data/account/work-education-history';
import {
  AddressInfo,
  BackupSyncSettings,
  EducationHistory,
  Permission,
  PersonalInfo,
  Storage,
  WorkHistory,
} from 'types/accounts';

interface AccountsContextInterface {
  personalInfo: PersonalInfo;
  workHistory: WorkHistory[];
  educationHistory: EducationHistory[];
  usersPermissions: {
    globalPermissions: Permission[];
    collabPermission: 'anyone' | 'only_code';
    userPermissions: Permission[];
  };
  shippingBillingAddress: {
    shippingAddress: AddressInfo;
    billingAddress: AddressInfo;
  };
  storage: {
    backupSyncSettings: BackupSyncSettings[];
    storageData: Storage;
  };
}

export const AccountsContext = createContext({} as AccountsContextInterface);

const AccountsProvider = ({ children }: PropsWithChildren) => {
  const personalInfoValues: PersonalInfo = personalInfoData;
  const workHistoryValues: WorkHistory[] = workHistory;
  const educationHistoryValues: EducationHistory[] = educationHistory;

  return (
    <AccountsContext
      value={{
        personalInfo: personalInfoValues,
        workHistory: workHistoryValues,
        educationHistory: educationHistoryValues,
        usersPermissions: {
          globalPermissions: globalPermissions,
          collabPermission: 'anyone',
          userPermissions: userPermissions,
        },
        shippingBillingAddress: {
          shippingAddress: shippingAddressData,
          billingAddress: billingAddressData,
        },
        storage: {
          backupSyncSettings,
          storageData,
        },
      }}
    >
      {children}
    </AccountsContext>
  );
};

export const useAccounts = () => use(AccountsContext);

export default AccountsProvider;
