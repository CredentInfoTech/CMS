/*eslint-disable @typescript-eslint/no-explicit-any  */

import * as React from "react";
import Sidebar from "./CMSPages/SideBar";
import { ICmsRebuildProps } from "./ICmsRebuildProps";
import { SPHttpClient } from "@microsoft/sp-http";
import LoaderOverlay from "./CMSPages/Loader";
import { sp } from "@pnp/sp/presets/all";

type CmsRebuildState = {
  userGroups: string[];
  cmsDetails: any[];
  isLoading: boolean;
};

export default class CmsRebuild extends React.Component<
  ICmsRebuildProps,
  CmsRebuildState
> {
  cmsMainRequest = "CMSRequest";
  cmsRequestDetails = "CMSRequestDetails";

  constructor(props: ICmsRebuildProps) {
    super(props);
    this.state = {
      userGroups: [],
      cmsDetails: [],
      isLoading: false,
    };
  }

  private fetchCurrentUserGroupDetails = async (): Promise<void> => {
    try {
      const siteUrl = this.props.context.pageContext.web.absoluteUrl;
      const groupsResponse = await this.props.context.spHttpClient.get(
        `${siteUrl}/_api/web/currentuser/groups`,
        SPHttpClient.configurations.v1
      );
      const groupsJson = await groupsResponse.json();

      const userGroupsFound: string[] = groupsJson.value.map(
        (group: { Title: string }) => group.Title
      );
      console.log(userGroupsFound, "userGroupsFound");
      this.setState({ userGroups: userGroupsFound });
    } catch (error) {
      console.error("Error fetching user groups:", error);
    }
  };

  private fetchAllItemsFromList = async (
    listTitle: string,
    selectFields: string[],
    expandFields: string[] = []
  ): Promise<any[]> => {
    let allItems: any[] = [];
    const batchSize = 4999;
    let lastId = 0;
    let hasMore = true;

    while (hasMore) {
      let query = sp.web.lists
        .getByTitle(listTitle)
        .items.select(...selectFields)
        .orderBy("ID", false)
        // .orderBy("UpComingInvoiceDate", true)
        .top(batchSize)
        .filter(`ID gt ${lastId}`);

      if (expandFields.length > 0) {
        query = query.expand(...expandFields);
      }

      const items = await query.get();
      allItems = allItems.concat(items);

      if (items.length < batchSize) {
        hasMore = false;
      } else {
        lastId = items[items.length - 1].ID;
      }
    }

    return allItems;
  };

  private fetchData = async (): Promise<void> => {
    try {
      const cmsMainListSelect = [
        "ID",
        "Title",
        "AccountManger/Id",
        "AccountManger/Title",
        "AccountManger/EMail",
        "ProjectManager/Id",
        "ProjectManager/Title",
        "ProjectManager/EMail",
        "ProjectLead/Id",
        "ProjectLead/Title",
        "ProjectLead/EMail",
        "CustomerName",
        "ProductType",
        "WorkTitle",
        "WorkDetails",
        "RenewalDate",
        "FileID",
        "UID",
        "RequestID",
        "IsAzureRequestClosed",
        "PoDate",
        "EmployeeName",
        "EmployeeEmail",
        "GSTNo",
        "IsReminderSet",
        "ContractType",
        "RenewalRequired",
        "FinanceUserName",
        "FinanceUserEmail",
        "IsProceed",
        "IsPaymentReceived",
        "POAmount",
        "IsInvoiceGenerated",
        "CustomerEmail",
        "Location",
        "EndDate",
        "InvoiceTaxAmount",
        "PaymentAmount",
        "PendingAmount",
        "UpComingInvoiceDate",
        "StartDateResource",
        "EndDateResource",
        "InvoiceCriteria",
        "CompanyName",
        "NewInvoiceTaxAmount",
        "NewPaymentTotal",
        "NewPendingTotal",
        "RunWF",
        "DelegateEmployeeName",
        "DelegateEmployeeEmail",
        "ApproverStatus",
        "ApproverComment",
        "GovtContract",
        "CustomerLocation",
        "Currency",
        "ReopenDate",
        "Status",
        "CloseStatus",
        "FlowStatus",
        "TstInvoiceAmount",
        "TstPaymentTotal",
        "TstPendingTotal",
        "BGDate",
        "TotalPaymentRecieved",
        "TotalPendingAmount",
        "BGRequired",
        "editReason",
        "PoNo",
        "PaymentMode",
        // "Modified",
        // "Created",
        // "Author",
      ];

      const cmsRequestDetailsSelect = [
        "ID",
        "Title",
        "RequestID",
        "ClaimNo",
        "Comments",
        "InvoiceDueDate",
        "ProceedDate",
        "InvoicNo",
        "InvoiceDate",
        "InvoiceFileID",
        "PaymentDate",
        "PaymentStatus",
        "InvoiceStatus",
        "PoAmount",
        "InvoiceAmount",
        "EndDate",
        "EmailBody",
        "InvoiceTaxAmount",
        "UpdatedInvoiceDueDate",
        "PendingAmount",
        "DocId",
        "CMSRequestID",
        "TotalPaymentRecieved",
        "TotalPendingAmount",
        "AreBothChaqrgesRequired",
        "RunWF",
        "StartDateResource",
        "EndDateResource",
       
        // "Modified",
        // "Created",
        // "Author",
        // "Modified By",
      ];

      const cmsRequestExpand = ["AccountManger", "ProjectManager" ,"ProjectLead"];
      // const cmsRequestExpand = [""];
      const cmsRequestDetailsExpand = [""];

      // Fetch all items
      const cmsMainData = await this.fetchAllItemsFromList(
        this.cmsMainRequest,
        cmsMainListSelect,
        cmsRequestExpand
      );

      const cmsRequestDetailsData = await this.fetchAllItemsFromList(
        this.cmsRequestDetails,
        cmsRequestDetailsSelect,
        cmsRequestDetailsExpand
      );

      console.log(cmsMainData, "cmsMainData");
      console.log(cmsRequestDetailsData, "cmsMainData,cmsRequestDetailsData");

       const mergedData = cmsMainData.map(mainItem => ({
      ...mainItem,
      invoiceDetails: cmsRequestDetailsData.filter(
        detail => detail.RequestID === mainItem.ID
      ),
    }));

    this.setState({
      cmsDetails: mergedData,
    });
      // this.setState({
      //   cmsDetails: cmsMainData,
      // });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  public async componentDidMount(): Promise<void> {
    this.setState({ isLoading: true });
    try {
      await this.fetchCurrentUserGroupDetails();
      await this.fetchData();
    } catch (error) {
      console.error("Error in componentDidMount:", error);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  public render(): React.ReactElement<ICmsRebuildProps> {
    return (
      <div>
        {this.state.isLoading ? (
          <LoaderOverlay />
        ) : (
          <Sidebar
            description={this.props.description}
            context={this.props.context}
            siteUrl={this.props.siteUrl}
            userGroups={this.state.userGroups}
            cmsDetails={this.state.cmsDetails}
            refreshCmsDetails={this.fetchData}
          />
        )}
      </div>
    );
  }
}

 