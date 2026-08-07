declare module 'react-helmet-async' {
  import * as React from 'react';
  export const Helmet: React.ComponentType<any>;
  export const HelmetProvider: React.ComponentType<any>;
}

declare module 'input-otp' {
  import * as React from 'react';
  export const OTPInput: React.ComponentType<any>;
  export const OTPInputContext: React.Context<any>;
}

declare module '@headless-tree/core' {
  export const createTree: any;
  export type TreeFeature = any;
  export type ItemInstance = any;
  export type TreeInstance = any;
}

declare module '@/pages/store-client/components/common/topbar' {
  import * as React from 'react';
  export const StoreClientTopbar: React.ComponentType<any>;
}

declare module '@/pages/account/home/settings-sidebar' {
  import * as React from 'react';
  export const AccountSettingsSidebar: React.ComponentType<any>;
}
