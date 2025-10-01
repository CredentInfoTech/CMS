/*eslint-disable @typescript-eslint/no-explicit-any */
import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface ICmsRebuildProps {
  description: string;
  context:WebPartContext;
  siteUrl:string;
  rowId?: string; 
  rowEdit?: string; //
  selectedRow?: any; // Add rows property to the interface
  userGroups: string[];
  cmsDetails: any[];
  refreshCmsDetails: any;
  selectedMenu?: string;
  props?: any;
   
  onExit?: () => void;
  onExitDashboard?: () => void;
}