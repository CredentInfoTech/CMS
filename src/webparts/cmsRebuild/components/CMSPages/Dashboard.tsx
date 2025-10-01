/* eslint-disable @typescript-eslint/no-use-before-define*/
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-lines */
/* eslint-disable no-void */
/* eslint-disable prefer-const */
/* eslint-disable no-empty */
/* eslint-disable eqeqeq */

import * as React from "react";
import { useState, useEffect } from "react";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { ICmsRebuildProps } from "../ICmsRebuildProps";
import "./Dashboard.module.scss";
// import {isUserInGroup} from "../services/SharePointService";
import { SPHttpClient } from "@microsoft/sp-http";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Spinner from "react-bootstrap/Spinner";
import { DatePicker } from "antd";
import * as moment from "moment";
import {
  faEye,
  faClockRotateLeft,
  faDiamondTurnRight,
  // faEdit,
} from "@fortawesome/free-solid-svg-icons";

import {
  updateDataToSharePoint,
  saveDataToSharePoint,
  getDocumentLibraryDataWithSelect,
  uploadFileWithMetadata,
  getSharePointData,
} from "../services/SharePointService"; // Import the service
import { Modal, Button as BootstrapButton } from "react-bootstrap"; // For modal UI

//import { updateDataToSharePoint,addFileInSharepoint, } from "../services/SharePointService"; // Import the service

import {
  Button,
  Stack,
  Typography,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  TextField, // Import TextField for better input styling
} from "@mui/material";
import RequestForm from "./RequestForm"; // Import RequestForm component
// import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
// import CancelIcon from "@mui/icons-material/Cancel";

interface RowData {
  id: string;
  contractNo: string;
  customerName: string;
  productType: string;
  poNo: string;
  poAmount: string;
  poDate: string;
  workTitle: string;
  upcomingInvoice: string;
  taxInvoiceAmount: string;
  employeeName: string;
  employeeEmail: string;
  accountManger: any;
  customerEmail: string;
  delegateEmployeeEmail: string;
  companyName: string;
  govtContract: string;
  location: string;
  customerLocation: string;
  renewalRequired: string;
  contractType: string;
  accountMangerId: number;
  accountMangerEmail: string;
  projectMangerEmail: string;
  isAzureRequestClosed?: string;
  projectLeadEmail: string;
  docID: string;
  isPaymentReceived: string;
  invoiceDetails: any[];
  invoiceStatus?: string;
  paymentStatus?: string;
  invoiceInvoicNo?: string;
  invoiceAmount?: string;
  invoiceComments?: string;
  invoiceInvoiceDate?: Date;
  invoicePaymentDate?: string;
  invoiceInvoiceFileID?: any;
  invoiceInvoiceID?: string | number;
  invoiceInvoiceRequestID?: string | number;
  // Add editable fields for pending payment
  paymentDate?: string;
  paymentValue?: string;
  pendingPayment?: string;
  paymentMode: string;
  addOnValue?: string;
  comments?: string;
  startDate?: string;
  endDate?: string;
  invoiceCriteria?: string;
  TotalPaymentRecieved: number;
  TotalPendingAmount: number;
}

// Removed unused RequestFormProps interface

const Dashboard = (props: ICmsRebuildProps) => {
  console.log(props.cmsDetails, "props.cmsDetails");
  const siteUrl = props.context.pageContext.web.absoluteUrl;
  console.log(siteUrl, "siteUrl====");
  console.log(props, "props-------------");
  
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const currentUserEmail = props.context.pageContext.user.email; // Store current user email
  const InvoicelistName = "CMSRequestDetails";
  const CMSInvoiceDocuments = "InvoiceDocument";
  const MainList = "CMSRequest";
  // console.log(CMSInvoiceDocuments);
  const PaymentHistoryListName = "CMSPaymentHistory";
  // console.log(PaymentHistoryListName);
  // const ContractDocumentLibaray = "ContractDocument";
  // console.log(ContractDocumentLibaray);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null); // Store selected row ID
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  // const [yourState, setYourState] = useState<any | null>(0);
  const [filterStatus, setFilterStatus] = useState<string>("Open"); // State to manage Open/Closed filter
  const [financeFilter, setFinanceFilter] = useState<string>("Invoice Pending"); // State for dropdown selection
  const [editableRowId, setEditableRowId] = useState<string | null>(null); // Track the row being edited
  const [statusFilter, setStatusFilter] = useState<string>("Pending"); // State for Status Filter
  const [rowFiles, setRowFiles] = useState<{ [rowId: string]: File }>({}); // Store files per row
  // const [allInvoiceFiles, setAllInvoiceFiles] = useState<{ invoiceRowId: string, files: any[] }[]>([]);
  // console.log(allInvoiceFiles, "allInvoiceFiles");
  const [contractDocuments, setContractDocuments] = useState<any[]>([]);
  const [invoiceDocuments, setInvoiceDocuments] = useState<any[]>([]);
  // const [paymentHistory, setPaymentHistory] = useState<any[]>([]); // Store payment history
  // console.log(setEditableRowId, "setEditableRowId");
  // const [groupSwitch, setGroupSwitch] = useState(0);

  useEffect(() => {
    void fetchCurrentUserGroupDetails();
  }, []);

  useEffect(() => {
    void fetchAllContractDocuments(siteUrl).then((data) => {
      // console.log(siteUrl, "fetchAllContractDocuments");
      setContractDocuments(data);
      console.log("Fetched Contract Documents:", data);
    });
    void fetchAllInvoiceDocuments(siteUrl).then((data) => {
      // console.log(siteUrl, "siteUrl");
      setInvoiceDocuments(data);
      console.log("Fetched invoice Documents:", data);
    });
  }, [siteUrl]);

  const fetchCurrentUserGroupDetails = async (): Promise<void> => {
    try {
      const siteUrl = props.context.pageContext.web.absoluteUrl;
      const groupsResponse = await props.context.spHttpClient.get(
        `${siteUrl}/_api/web/currentuser/groups`,
        SPHttpClient.configurations.v1
      );
      const groupsJson = await groupsResponse.json();

      const userGroupsFound: string[] = groupsJson.value.map(
        (group: { Title: string }) => group.Title
      );
      //console.log(userGroupsFound, "userGroupsFound");
      setUserGroups(userGroupsFound);
    } catch (error) {
      console.error("Error fetching user groups:", error);
    }
  };
  // console.log(userGroups, "userGroups");
  // const [highlightedButton, setHighlightedButton] = useState<"admin" | "finance">("finance");

  // const [groupSwitch, setGroupSwitch] = useState(0);

  // Helper: check if user is in both groups
  // const isInBothGroups =
  //   userGroups.includes("CMSAdminGroup") &&
  //   userGroups.includes("CMSAccountGroup");

  // console.log(isInBothGroups, "isInBothGroups");
  // ...existing code...
  // const [showSpecialButtons, setShowSpecialButtons] = useState(false);

  // Search state
  const [searchText, setSearchText] = useState("");

  // Helper: filter rows by search text (case-insensitive, all string fields)
  function filterRowsBySearch(rows: any[], search: string) {
    if (!search) return rows;
    const lower = search.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some(
        (v) => typeof v === "string" && v.toLowerCase().includes(lower)
      )
    );
  }
  // const [activePage, setActivePage] = useState<"finance" | "admin">("finance");
  // ...existing code...
  // const [activePage, setActivePage] = useState<"finance" | "admin" | "requester">("finance");

  // const isInAdmin = userGroups.includes("CMSAdminGroup");
  // const isInFinance = userGroups.includes("CMSAccountGroup");
  // const isInRequester = userGroups.includes("CMSTeamMember");
  // const groupCount = [isInAdmin, isInFinance, isInRequester].filter(Boolean).length;
  // ...existing code...
  // const [showFinanceButton, setShowFinanceButton] = useState(false);
  // const [showAdminButton, setShowAdminButton] = useState(false);
  // const [showRequesterButton, setShowRequesterButton] = useState(false);

  // useEffect(() => {
  //   // Finance button: user in all groups, or admin+finance, or finance+requester
  //   setShowFinanceButton(
  //     (isInFinance && isInAdmin && isInRequester) ||
  //     (isInFinance && isInAdmin) ||
  //     (isInFinance && isInRequester)
  //   );
  //   // Admin button: user in all groups, or admin+finance, or admin+requester
  //   setShowAdminButton(
  //     (isInFinance && isInAdmin && isInRequester) ||
  //     (isInFinance && isInAdmin) ||
  //     (isInAdmin && isInRequester)
  //   );
  //   // Requester button: user in all groups, or finance+requester, or admin+requester
  //   setShowRequesterButton(
  //     (isInFinance && isInAdmin && isInRequester) ||
  //     (isInFinance && isInRequester) ||
  //     (isInAdmin && isInRequester)
  //   );
  // }, [isInFinance, isInAdmin, isInRequester]);

  // const handleAdminPageClick = () => {
  //   setUserGroups(["CMSAdminGroup"]);
  //   setActivePage("admin");
  // };

  // const handleFinancePageClick = () => {
  //   setUserGroups(["CMSAccountGroup"]);
  //   setActivePage("finance");
  // };
  //   const handleRequeterPageClick = () => {
  //   setUserGroups(["CMSTeamMember"]);
  //   setActivePage("finance");
  // };

  const twoDecimalFormatter = (params: { value: number }) =>
  params.value !== undefined && params.value !== null
    ? Number(params.value).toFixed(2)
    : "";

    
  const columns: GridColDef[] = [
    {
      field: "contractNo",
      headerName: "Contract No",
      minWidth: 200,
      flex: 1,
      cellClassName: "contractNoCell", // Add this line
      headerClassName: "contractNoHeader", // Add this line

      renderCell: (params: any) => {
        return (
          <Stack direction="row" spacing={1}>
            <a
              href="#"
              style={{
                cursor: "pointer",
                color: "#1976d2",
                textDecoration: "underline",
              }}
              onClick={(e) => {
                e.preventDefault();
                handleShoworm(params.row.id, params.row);
              }}
            >
              {params.row.contractNo}
            </a>
          </Stack>
        );
      },
    },
    // { field: "contractNo", headerName: "Contract No", minWidth: 130, flex: 1 },
    {
      field: "customerName",
      headerName: "Customer Name",
      minWidth: 140,
      flex: 1,
    },
    {
      field: "productType",
      headerName: "Product Type",
      minWidth: 140,
      flex: 1,
    },
    { field: "poNo", headerName: "Po No.", minWidth: 120, flex: 1 },
    { field: "poAmount", headerName: "Po Amount", minWidth: 130, flex: 1 },
    {
      field: "upcomingInvoice",
      headerName: "UpComing Invoice Date",
      minWidth: 150,
      flex: 1,
    },
    { field: "poDate", headerName: "Po Date", minWidth: 120, flex: 1 },
    { field: "workTitle", headerName: "Work Title", minWidth: 150, flex: 1 },

    {
      field: "TotalPaymentRecieved",
      headerName: "Invoice Recieved Amount",
      type: "number",
      minWidth: 130,
      flex: 1,
      editable: false,
      valueFormatter: twoDecimalFormatter,
    },
    {
      field: "TotalPendingAmount",
      headerName: "Invoice Pending Amount",
      type: "number",
      minWidth: 130,
      flex: 1,
      editable: false,
      valueFormatter: twoDecimalFormatter,
    },
    {
      field: "InvoiceTaxAmount",
      headerName: "Total Invoice Tax Amount",
      type: "number",
      minWidth: 130,
      flex: 1,
      editable: false,
      valueFormatter: twoDecimalFormatter,
    },
  ];
  // Loader overlay
  const LoaderOverlay = () => (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(255,255,255,0.6)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Spinner animation="border" variant="primary" />
      <span className="ms-3">Processing...</span>
    </div>
  );

  const handleRowUpdate = (newRow: any, oldRow: any) => {
    // Validate paymentValue for non-negative, non-zero

    // Do any necessary validation or merging here
    const updatedRow = { ...oldRow, ...newRow };

    // Optionally persist or validate file input
    if (newRow.invoiceAttachment instanceof File) {
      // Save it to backend or local state as needed
      console.log("File attached:", newRow.invoiceAttachment);
    }

    return updatedRow; // Must return updated row
  };
  const handleAttachmentChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    row: any
  ) => {
    event.preventDefault();
    const file = event.target.files?.[0];
    if (file) {
      setRowFiles((prev) => ({ ...prev, [row.id]: file }));
      alert(`File "${file.name}" is selected.`);
    } else {
      setRowFiles((prev) => {
        const updated = { ...prev };
        delete updated[row.id];
        return updated;
      });

      setTimeout(() => {
        const grid = document.querySelector(`[data-id="${row.id}"]`);
        if (grid) {
        }
      }, 0);
    }
  };

  // const handleEmailSentDateChange = (
  //   event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  //   row: any
  // ) => {
  //   const selectedDate = event.target.value;

  //   // console.log("Email Sent Date for row", row.id, selectedDate);
  // };

  // const handleGenerateInvoice = (row: any) => {
  //   // console.log("Generate Invoice for", row.id, row);
  // };

  // console.log(handleEmailSentDateChange, handleGenerateInvoice);

  const handleSaveClick = (row: any) => {
    setEditableRowId(null);
    console.log("Save clicked for row ID:", row);

    void updateInvoiceDetails(row, rowFiles[row.id]);
  };

  const updateInvoiceDetails = async (row: any, file?: File) => {
    if (financeFilter === "Invoice Pending") {
      setIsLoading(true);
      // console.log("update button clicked", row);

      if (!file) {
        setIsLoading(false);
        alert(
          "Please select a file before saving. File selection is mandatory."
        );
        return;
      }

      if (
        !row.invoiceInvoicNo ||
        !row.invoiceInvoiceDate ||
        !row.taxInvoiceAmount
      ) {
        setIsLoading(false);
        alert(
          "Invoice No, Invoice Date, and Tax Invoice Value are mandatory. Please fill all required fields."
        );
        return;
      }
      if (Number(row.taxInvoiceAmount) < Number(row.invoiceAmount)) {
        setIsLoading(false);
        alert(
          "Tax Invoice Value must be greater than or equal to Invoice Amount."
        );
        return;
      }

      // console.log(row.taxInvoiceAmount, row.invoiceAmount, "row.invoiceAmount");
      const invoiceExists = await checkInvoiceNo(row.invoiceInvoicNo);

      if (invoiceExists) {
        setIsLoading(false);
        alert(
          "This Invoice No already exists. Please enter a unique Invoice No."
        );
        return;
      }

      let uploadedFileResult = null;
      const generatedUID = Math.random()
        .toString(36)
        .substr(2, 16)
        .toUpperCase();

      try {
        // const claimNo = row.contractNo + "-" + row.invoiceClaimNo;
        // console.log(row.contractNo, row.invoiceClaimNo, claimNo, "claimNo");
        // You can adjust metadata, filterQuery, selectedValues as needed
        const metadata = {
          //  DocID: row.docID,
          DocID: generatedUID,
          ClaimNo: row.contractNo,
        };
        // console.log(metadata, "metadata");
        uploadedFileResult = await uploadFileWithMetadata(
          file,
          metadata,
          CMSInvoiceDocuments
        );

        console.log(
          "File uploaded to SharePoint:",
          uploadedFileResult,
          metadata
        );

        // After successful file upload, update the SharePoint list item

        const updatedata = {
          InvoiceStatus: "Generated",
          InvoicNo: row.invoiceInvoicNo,
          InvoiceDate: row.invoiceInvoiceDate,
          InvoiceTaxAmount: Number(row.taxInvoiceAmount),
          // InvoiceFileID: row.docID,
          InvoiceFileID: generatedUID,
          TotalPendingAmount: Number(row.taxInvoiceAmount)
        };

        // console.log("updatedata", updatedata);
        try {
          const updatedData = await updateDataToSharePoint(
            InvoicelistName,
            updatedata,
            siteUrl,
            row.invoiceInvoiceID
          );
          console.log("updatedata", updatedData);

          if (props.refreshCmsDetails) {
            await props.refreshCmsDetails();
          }

          await refreshInvoiceDocuments();
          setIsLoading(false);
          alert("Invoice Generated Successfully.");
        } catch (error) {
          setIsLoading(false);
          console.error("Failed to update request:", error);
          alert(
            "Something went wrong while sending your edit request. Please try again."
          );
        }
      } catch (error) {
        setIsLoading(false);
        console.error("File upload failed:", error);
        alert("File upload failed. Please try again.");
        return;
      }
    } else if (financeFilter === "Payment Pending") {
      setIsLoading(true);
      if (!row.paymentDate || !row.paymentValue) {
        setIsLoading(false);
        alert(
          "Payment Date and Payment Value are mandatory. Please fill all required fields."
        );
        return;
      }

      // console.log("update payment button clicked", row);
      // console.log(row.id, "row.id");
      const CMSRequestItemID = row.id.split("-")[0];
      const CMSInvoiceDetailIndex = row.id.split("-")[1];

      let isInvoicePaymentReceived = "";
      let PaymentAmount: number = Number(row.paymentValue);
      let totalRecievedAmount =
        row.invoiceDetails[CMSInvoiceDetailIndex].TotalPaymentRecieved || 0;
      let TaxAmount = row.taxInvoiceAmount;
      // let totalPendingAmount =
      //   row.invoiceDetails[CMSInvoiceDetailIndex].TotalPendingAmount || 0;
      // console.log(totalPendingAmount);
      totalRecievedAmount = Number(totalRecievedAmount).toFixed(2);
      PaymentAmount = Math.round(Number(PaymentAmount) * 100) / 100;
      let InvoiceRecievedAmount =
        Number(totalRecievedAmount) + Number(PaymentAmount);
      // let InvoicePendingAmount = Number(TaxAmount) - Number(InvoiceRecievedAmount);
      const InvoicePendingAmount = Number(
        (Number(TaxAmount) - Number(InvoiceRecievedAmount)).toFixed(2)
      );
      if (InvoiceRecievedAmount.toFixed(2) > TaxAmount.toFixed(2)) {
        setIsLoading(false);
        alert(
          "Payment Value cannot be greater than the pending amount for this invoice."
        );
        return;
      }

      if (InvoiceRecievedAmount === 0) {
        setIsLoading(false);
        alert("Payment Value cannot be 0.");
        return;
      }

      if (InvoicePendingAmount == 0 || InvoicePendingAmount < 0) {
        isInvoicePaymentReceived = "Yes";
      }

      const updatedata = {
        PaymentDate: row.paymentDate,
        CMSRequestItemID: row.invoiceInvoiceID,
        CMSRequestID: CMSRequestItemID,
        ClaimNo: row.ClaimNo,
        InvoiceTaxAmount: row.taxInvoiceAmount,
        PaymentAmount: Number(PaymentAmount),
        PendingAmount: InvoicePendingAmount,
        UID: row.UID,
        Comment: row.comments,
      };

      const updateInvoicedata = {
        TotalPaymentRecieved: InvoiceRecievedAmount,
        TotalPendingAmount: InvoicePendingAmount,
        PaymentStatus: isInvoicePaymentReceived,
      };

      const updateRequestmetadata = {
        IsPaymentReceived: "Yes",
        RunWF: "Yes",
      };

      try {
        const updatedData = await saveDataToSharePoint(
          PaymentHistoryListName,
          updatedata,
          siteUrl
        );

        const updatedInvoiceData = await updateDataToSharePoint(
          InvoicelistName,
          updateInvoicedata,
          siteUrl,
          row.invoiceInvoiceID
        );

        if (InvoicePendingAmount == 0 || InvoicePendingAmount < 0) {
          // const filterQuery = `$select=*&$filter=TotalPendingAmount ge 1 and RequestID eq ${CMSRequestItemID}`;
          const filterQuery = `$select=*&$filter=(TotalPendingAmount ge 1 or TotalPendingAmount eq null) and RequestID eq ${CMSRequestItemID}`;
          const data = await getSharePointData(
            props,
            InvoicelistName,
            filterQuery
          );

          // console.log(data, "checkdata");

          if (data.length == 0) {
            // console.log(updateRequestmetadata);
            const updateRequestdata = await updateDataToSharePoint(
              MainList,
              updateRequestmetadata,
              siteUrl,
              CMSRequestItemID
            );
            console.log(
              "updatedata",
              updatedData,
              updatedInvoiceData,
              updateRequestdata
            );
          }
        }

        // console.log("updatedata", updatedData, updatedInvoiceData);

        if (props.refreshCmsDetails) {
          await props.refreshCmsDetails();
        }
        setIsLoading(false);
        alert("Payment Added Successfully.");
      } catch (error) {
        setIsLoading(false);
        console.error("Failed to update request:", error);
        alert(
          "Something went wrong while sending your edit request. Please try again."
        );
      }
    } else {
    }
  };

  const pendingPaymentColumns: GridColDef[] = [
    {
      field: "customerName",
      headerName: "Customer Name",
      minWidth: 140,
      flex: 1,
      editable: false,
    },
    {
      field: "invoiceInvoicNo",
      headerName: "Invoice No",
      minWidth: 130,
      flex: 1,
      editable: false,
    },

    {
      field: "taxInvoiceAmount",
      headerName: "Tax Invoice Value",
      minWidth: 150,
      flex: 1,
      editable: false,
    },
    // Editable fields

    // {
    //   field: "paymentDate",
    //   headerName: "Payment Recieved Date",
    //   minWidth: 200,
    //   flex: 1,
    //   renderCell: (params) => {
    //     let inputValue = "";
    //     if (params.row.paymentDate) {
    //       const dateObj = new Date(params.row.paymentDate);
    //       if (!isNaN(dateObj.getTime())) {

    //         inputValue = dateObj.toISOString().split("T")[0];
    //       }
    //     }

    //     return (
    //       <div>
    //         <TextField
    //           size="small"
    //           fullWidth
    //           type="date"
    //           sx={{ mt: 0.625 }} // 5px margin top
    //           value={inputValue}
    //           disabled={statusFilter !== "Pending"}
    //           onChange={(e) => {
    //             params.api.updateRows([
    //               { ...params.row, paymentDate: e.target.value }
    //             ]);
    //           }}
    //           InputLabelProps={{ shrink: true }}
    //         />

    //       </div>
    //     );
    //   },
    // },
    {
      field: "paymentDate",
      headerName: "Payment Recieved Date",
      minWidth: 200,
      flex: 1,
      renderCell: (params) => {
        // Use moment for value, fallback to null
        const value = params.row.paymentDate
          ? moment(params.row.paymentDate, "YYYY-MM-DD", true).isValid()
            ? moment(params.row.paymentDate)
            : null
          : null;

        return (
          <DatePicker
            format="DD-MM-YYYY"
            value={value}
            style={{ width: "100%", marginTop: 5 }}
            disabled={statusFilter !== "Pending"}
            onChange={(date) => {
              params.api.updateRows([
                {
                  ...params.row,
                  paymentDate: date ? date.format("YYYY-MM-DD") : "",
                },
              ]);
            }}
            allowClear
            disabledDate={(current) =>
              current && current > moment().endOf("day")
            }
          />
        );
      },
    },

    {
      field: "paymentValue",
      headerName: "Amount Recieved",
      type: "number",
      minWidth: 170,
      flex: 1,
      renderCell: (params) => (
        <TextField
          size="small"
          fullWidth
          type="number"
          sx={{ mt: 0.625 }} // 5px margin top
          value={params.row.paymentValue || ""}
          disabled={statusFilter !== "Pending"}
          // slotProps={{
          //   input: {
          //     inputProps: { min: 1 }  // 👈 replaces inputProps
          //   }
          // }}
          // error={params.row.paymentValue === "0"}  // 👈 red highlight when 0
          // helperText={
          //   params.row.paymentValue === "0"
          //     ? "Amount received cannot be 0"
          //     : ""
          // }

          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "-" || e.key === "+") {
              e.preventDefault(); // block minus, plus
            }
          }}

          onChange={(e) => {
            const value = e.target.value;

            if (value === "") {
              params.api.updateRows([{ ...params.row, paymentValue: "" }]);
              return;
            }

            
            if (parseFloat(value) > 0) {
              params.api.updateRows([
                { ...params.row, paymentValue: value },
              ]);
            } else {
              alert("Payment Value must be greater than 0.");
            }
          

            

            // // if (parseFloat(value) > 0) {
            // // params.api.updateRows([{ ...params.row, paymentValue: value }]);
            // // } else {
            // //   alert("Payment Value must be greater than 0.");
            //    const num = Number(value);

            // // block negatives and zero
            // if (num <= 0) return;

            // // only allow integers
            // if (!Number.isInteger(num)) return;

            // // valid number >= 1
            // params.api.updateRows([{ ...params.row, paymentValue: num }]);
            

            // // }
          }}
        />
      ),
    },
    {
      field: "InvoiceTotalPaymentRecieved",
      headerName: "Total Recieved Payment Amount",
      type: "number",
      minWidth: 130,
      flex: 1,
      editable: false,
    },
    {
      field: "invoiceTotalPendingAmount",
      headerName: "Total Pending Payment Amount",
      type: "number",
      minWidth: 130,
      flex: 1,
      editable: false,
    },

    {
      field: "comments",
      headerName: "Comments",
      minWidth: 200,
      flex: 1,
      renderCell: (params) => (
        <TextField
          size="small"
          fullWidth
          sx={{ mt: 0.625 }} // 5px margin top
          value={params.row.comments || ""}
          disabled={statusFilter !== "Pending"}
          onChange={(e) => {
            params.api.updateRows([
              { ...params.row, comments: e.target.value },
            ]);
          }}
        />
      ),
    },
    {
      field: "contractNo",
      headerName: "Contract ID (Request ID)",
      minWidth: 130,
      flex: 1,
      renderCell: (params: any) => {
        return (
          <Stack direction="row" spacing={1}>
            <a
              href="#"
              style={{
                cursor: "pointer",
                color: "#1976d2",
                textDecoration: "underline",
              }}
              onClick={(e) => {
                e.preventDefault();
                handleShoworm(params.row.id, params.row);
              }}
            >
              {params.row.contractNo}
            </a>
          </Stack>
        );
      },
      editable: false,
      // hideable: true,
    },
    { field: "poNo", headerName: "Po No.", minWidth: 120, flex: 1 },
    { field: "poDate", headerName: "Po Date", minWidth: 120, flex: 1 },
    {
      field: "action",
      headerName: "Action",

      minWidth: 280,
      flex: 1,
      renderCell: (params) =>
        statusFilter === "Done" ? (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              // color="primary"
              style={{
                background: "#1565C0",
                color: "white",
                marginLeft: "10px",
                marginRight: "10px",
              }}
              // startIcon={<FontAwesomeIcon icon={faDiamondTurnRight} />}
              onClick={() => handleShoworm(params.row.id, params.row)}
            >
              <FontAwesomeIcon icon={faEye} title="Contract Details" />
            </Button>
            {params.row.InvoiceTotalPaymentRecieved > 0 && (
              <Button
                variant="outlined"
                style={{
                  color: "#1976d2",
                  borderColor: "#1976d2",
                  marginLeft: "10px",
                }}
                onClick={() => handleHistoryClick(params.row)}
              >
                <FontAwesomeIcon
                  icon={faClockRotateLeft}
                  title="Payment History"
                />
              </Button>
            )}
          </Stack>
        ) : editableRowId === params.row.id ? (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              // color="primary"
              style={{
                background: "green",
                color: "white",
                marginLeft: "10px",
              }}
              startIcon={<SaveIcon />}
              onClick={() => handleSaveClick(params.row)}
            >
              Save
            </Button>

            {params.row.InvoiceTotalPaymentRecieved > 0 && (
              <Button
                variant="outlined"
                style={{
                  color: "#1976d2",
                  borderColor: "#1976d2",
                  marginLeft: "10px",
                }}
                onClick={() => handleHistoryClick(params.row)}
              >
                <FontAwesomeIcon
                  icon={faClockRotateLeft}
                  title="Payment History"
                />
              </Button>
            )}
          </Stack>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              // color="primary"
              style={{
                background: "green",
                color: "white",
                marginLeft: "10px",
              }}
              startIcon={<SaveIcon />}
              onClick={() => handleSaveClick(params.row)}
            >
              Save
            </Button>
            <Button
              variant="contained"
              // color="primary"
              style={{
                background: "#1565C0",
                color: "white",
                marginLeft: "10px",
              }}
              // startIcon={<FontAwesomeIcon icon={faDiamondTurnRight} />}
              onClick={() => handleShoworm(params.row.id, params.row)}
            >
              <FontAwesomeIcon icon={faEye} title="Contract Details" />
            </Button>

            {params.row.InvoiceTotalPaymentRecieved > 0 && (
              <Button
                variant="outlined"
                style={{
                  color: "#1976d2",
                  borderColor: "#1976d2",
                  marginLeft: "10px",
                }}
                onClick={() => handleHistoryClick(params.row)}
              >
                <FontAwesomeIcon
                  icon={faClockRotateLeft}
                  title="Payment History"
                />
              </Button>
            )}
          </Stack>
        ),
    },
  ];

  const paymentColumns: GridColDef[] = [
    {
      field: "customerName",
      headerName: "Customer Name",
      minWidth: 140,
      flex: 1,
      editable: false,
    },
    {
      field: "invoiceInvoicNo",
      headerName: "Invoice No",
      minWidth: 130,
      flex: 1,
      editable: false,
    },

    {
      field: "taxInvoiceAmount",
      headerName: "Tax Invoice Value",
      minWidth: 150,
      flex: 1,
      editable: false,
    },
    {
      field: "InvoiceTotalPaymentRecieved",
      headerName: "Invoice Recieved Amount",
      type: "number",
      minWidth: 130,
      flex: 1,
      editable: false,
    },
    // {
    //   field: "invoiceTotalPendingAmount",
    //   headerName: "Invoice Pending Amount",
    //   type: "number",
    //   minWidth: 130,
    //   flex: 1,
    //   editable: false,
    // },
    // {
    //   field: "invoiceInvoiceDate",
    //   headerName: "Invoice Date",
    //   minWidth: 130,
    //   flex: 1,
    //   editable: false,
    // },

    // Editable fields
    // {
    //   field: "paymentDate",
    //   headerName: "Payment Date",
    //   type: "date",
    //   minWidth: 130,
    //   flex: 1,
    //   editable: false,
    // },
    // {
    //   field: "paymentValue",
    //   headerName: "Payment Value",
    //   type: "number",
    //   minWidth: 130,
    //   flex: 1,
    //   editable: false,
    // },
    // // {
    // //   field: "pendingPayment",
    // //   headerName: "Pending Payment",
    // //   type: "number",
    // //   minWidth: 130,
    // //   flex: 1,
    // //   editable: false,
    // // },
    // {
    //   field: "addOnValue",
    //   headerName: "Add-On Value",
    //   type: "number",
    //   minWidth: 130,
    //   flex: 1,
    //   editable: false,
    // },
    // {
    //   field: "comments",
    //   headerName: "Comments",

    //   minWidth: 200,
    //   flex: 1,
    //   editable: false,
    // },
    {
      field: "contractNo",
      headerName: "Contract ID (Request ID)",
      minWidth: 130,
      flex: 1,
      renderCell: (params: any) => {
        return (
          <Stack direction="row" spacing={1}>
            <a
              href="#"
              style={{
                cursor: "pointer",
                color: "#1976d2",
                textDecoration: "underline",
              }}
              onClick={(e) => {
                e.preventDefault();
                handleShoworm(params.row.id, params.row);
              }}
            >
              {params.row.contractNo}
            </a>
          </Stack>
        );
      },
      editable: false,
      // hideable:true,
    },
    { field: "poNo", headerName: "Po No.", minWidth: 120, flex: 1 },
    { field: "poDate", headerName: "Po Date", minWidth: 120, flex: 1 },
    {
      field: "action",
      headerName: " ",

      minWidth: 280,
      flex: 1,
      renderCell: (params) =>
        statusFilter === "Done" ? (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              style={{
                background: "#1565C0",
                color: "white",
                marginLeft: "10px",
                marginRight: "10px",
              }}
              // startIcon={<FontAwesomeIcon icon={faDiamondTurnRight} />}
              onClick={() => handleShoworm(params.row.id, params.row)}
            >
              <FontAwesomeIcon icon={faEye} title="Contract Details" />
            </Button>
            {/* <Button
              variant="outlined"
              style={{ color: "#1976d2", borderColor: "#1976d2" }}
              onClick={() => handleHistoryClick(params.row)}
            >
              <FontAwesomeIcon
                            icon={faClockRotateLeft}
                            title="Payment History"
                          />
            </Button> */}
            {params.row.InvoiceTotalPaymentRecieved > 0 && (
              <Button
                variant="outlined"
                style={{
                  color: "#1976d2",
                  borderColor: "#1976d2",
                  marginLeft: "10px",
                }}
                onClick={() => handleHistoryClick(params.row)}
              >
                <FontAwesomeIcon
                  icon={faClockRotateLeft}
                  title="Payment History"
                />
              </Button>
            )}
          </Stack>
        ) : editableRowId === params.row.id ? (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              style={{
                background: "green",
                color: "white",
                marginLeft: "10px",
              }}
              // startIcon={<SaveIcon />}
              onClick={() => handleSaveClick(params.row)}
            >
              Save
            </Button>
            {/* <Button
              variant="outlined"
              style={{ color: "#1976d2", borderColor: "#1976d2" }}
            >
              <FontAwesomeIcon
                            icon={faClockRotateLeft}
                            title="Payment History"
                          />
            </Button> */}
            {params.row.InvoiceTotalPaymentRecieved > 0 && (
              <Button
                variant="outlined"
                style={{
                  color: "#1976d2",
                  borderColor: "#1976d2",
                  marginLeft: "10px",
                }}
                onClick={() => handleHistoryClick(params.row)}
              >
                <FontAwesomeIcon
                  icon={faClockRotateLeft}
                  title="Payment History"
                />
              </Button>
            )}
          </Stack>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              style={{
                background: "green",
                color: "white",
                marginLeft: "10px",
              }}
              // startIcon={<SaveIcon />}
              onClick={() => handleSaveClick(params.row)}
            >
              Save
            </Button>
            <Button
              variant="contained"
              // color="primary"
              style={{
                background: "#1565C0",
                color: "white",
                marginLeft: "10px",
              }}
              // startIcon={<FontAwesomeIcon icon={faDiamondTurnRight} />}
              onClick={() => handleShoworm(params.row.id, params.row)}
            >
              <FontAwesomeIcon icon={faEye} title="Contract Details" />
            </Button>
            {/* <Button
              variant="outlined"
              style={{ color: "#1976d2", borderColor: "#1976d2" }}
              onClick={() => handleHistoryClick(params.row)}
            >
              <FontAwesomeIcon
                            icon={faClockRotateLeft}
                            title="Payment History"
                          />
            </Button> */}
            {params.row.InvoiceTotalPaymentRecieved > 0 && (
              <Button
                variant="outlined"
                style={{
                  color: "#1976d2",
                  borderColor: "#1976d2",
                  marginLeft: "10px",
                }}
                onClick={() => handleHistoryClick(params.row)}
              >
                <FontAwesomeIcon
                  icon={faClockRotateLeft}
                  title="Payment History"
                />
              </Button>
            )}
          </Stack>
        ),
    },
  ];

  const checkInvoiceNo = async (invoiceNo: string) => {
    const filterQuery = `$filter=InvoicNo eq '${invoiceNo}'&$orderby=Id desc&$Top=1`;
    try {
      const response = await getSharePointData(
        props,
        InvoicelistName,
        filterQuery
      );
      if (response && response.length > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error fetching invoice Details:", error);
      return false;
    }
  };

  const pendingInvoiceColumns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
      minWidth: 90,
      flex: 1,
      editable: false,
      hideable: true,
    },
    {
      field: "contractNo",
      headerName: "Contract No",
      minWidth: 130,
      // pinned: 'left',
      flex: 1,
      renderCell: (params: any) => {
        return (
          <Stack direction="row" spacing={1}>
            <a
              href="#"
              style={{
                cursor: "pointer",
                color: "#1976d2",
                textDecoration: "underline",
              }}
              onClick={(e) => {
                e.preventDefault();
                handleShoworm(params.row.id, params.row);
              }}
            >
              {params.row.contractNo}
            </a>
          </Stack>
        );
      },
      editable: false,
    },
    {
      field: "customerName",
      headerName: "Customer Name",
      minWidth: 140,
      flex: 1,
      editable: false,
    },
    {
      field: "customerEmail",
      headerName: "Customer Email",
      minWidth: 140,
      flex: 1,
      editable: false,
    },
    { field: "poNo", headerName: "Po No.", minWidth: 120, flex: 1 },
    { field: "poDate", headerName: "Po Date", minWidth: 120, flex: 1 },
    {
      field: "poAttachment",
      headerName: "PO Attachment",
      minWidth: 160,
      flex: 1,
      editable: false,
      renderCell: (params: any) => (
        // params.row.poDocuments && params.row.poDocuments.length > 0 ? (
        <>
          <React.Fragment key={params.row.FileID}>
            <a
              href={params.row.poEncodedAbsUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={params.row.poFileLeafRef}
              style={{
                color: "#1976d2",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              {params.row.poFileLeafRef}
            </a>
            {/* {idx < params.row.poDocuments.length - 1 && ", "} */}
          </React.Fragment>
          {/* ) */}
          {/* )} */}
        </>
      ),
      // ) : (
      //   <span style={{ color: "#888" }}>No PO File</span>
      // ),
    },

    {
      field: "invoiceComments",
      headerName: "Invoice Description",
      minWidth: 120,
      flex: 1,
      editable: false,
    },
    {
      field: "invoiceAmount",
      headerName: "Invoice Amount",
      minWidth: 150,
      flex: 1,
      editable: false,
      // valueFormatter: twoDecimalFormatter
    },
    // editable fields
    // {
    //   field: "invoiceAttachment",
    //   headerName: "Invoice Attachment",
    //   minWidth: 160,
    //   flex: 1,
    //   renderCell: (params) => (
    //     <div style={{ width: "100%" }}>
    //       <Button variant="outlined" component="label" size="small" fullWidth>
    //         Upload
    //         <input
    //           type="file"
    //           hidden
    //           onChange={(e) => handleAttachmentChange(e, params.row)}
    //         />
    //       </Button>
    //       {/* Show selected file name if exists */}
    //       {rowFiles[params.row.id] && (
    //         <Typography
    //           variant="caption"
    //           sx={{ display: "block", mt: 1, wordBreak: "break-all" }}
    //         >
    //           {rowFiles[params.row.id].name}
    //         </Typography>
    //       )}
    //       {/* Use fileVersion to force re-render */}
    //       <span style={{ display: "none" }}>{params.row.fileVersion}</span>
    //     </div>
    //   ),
    // },
    // ...existing code...
    {
      field: "invoiceAttachment",
      headerName: "Invoice Attachment",
      minWidth: 350,
      flex: 1,
      renderCell: (params) => (
        <div style={{ width: "100%" }}>
          <input
            type="file"
            // style={{ width: "100%" }}
            className="form-control"
            style={{
              marginTop: "5px",
            }}
            onChange={(e) => handleAttachmentChange(e, params.row)}
          />
          <Typography
            variant="caption"
            sx={{ display: "none", mt: 1, wordBreak: "break-all" }}
          >
            {rowFiles[params.row.id]?.name || ""}
          </Typography>
          {/* Use fileVersion to force re-render */}
          <span style={{ display: "none" }}>{params.row.fileVersion}</span>
        </div>
      ),
    },

    {
      field: "invoiceInvoicNo",
      headerName: "Invoice No",
      minWidth: 200,
      flex: 1,
      renderCell: (params) => (
        <TextField
          size="small"
          fullWidth
          sx={{ mt: 0.625 }} // 5px margin top
          value={params.row.invoiceInvoicNo || ""}
          disabled={!rowFiles[params.row.id]}
          onChange={(e) => {
            params.api.updateRows([
              { ...params.row, invoiceInvoicNo: e.target.value },
            ]);
          }}
        />
      ),
    },
    // {
    //   field: "invoiceInvoiceDate",
    //   headerName: "Invoice Date",
    //   minWidth: 200,
    //   flex: 1,
    //   renderCell: (params) => {

    //     let inputValue = "";
    //     if (params.row.invoiceInvoiceDate) {
    //       const dateObj = new Date(params.row.invoiceInvoiceDate);
    //       if (!isNaN(dateObj.getTime())) {
    //         inputValue = dateObj.toISOString().split("T")[0];
    //       }
    //     }
    //     return (
    //       <div>
    //         <TextField
    //           size="small"
    //           fullWidth
    //           type="date"
    //           sx={{ mt: 0.625 }} // 5px margin top
    //           value={inputValue}
    //           disabled={!rowFiles[params.row.id]}
    //           onChange={(e) => {
    //             params.api.updateRows([
    //               { ...params.row, invoiceInvoiceDate: e.target.value }
    //             ]);
    //           }}
    //           InputLabelProps={{ shrink: true }}
    //         />

    //       </div>
    //     );
    //   },
    // },
    {
      field: "invoiceInvoiceDate",
      headerName: "Invoice Date",
      minWidth: 200,
      flex: 1,
      renderCell: (params) => {
        // Use moment for value, fallback to null
        const value = params.row.invoiceInvoiceDate
          ? moment(params.row.invoiceInvoiceDate, "YYYY-MM-DD", true).isValid()
            ? moment(params.row.invoiceInvoiceDate)
            : null
          : null;

        return (
          <DatePicker
            format="DD-MM-YYYY"
            value={value}
            style={{ width: "100%", marginTop: 5 }}
            disabled={!rowFiles[params.row.id]}
            onChange={(date) => {
              params.api.updateRows([
                {
                  ...params.row,
                  invoiceInvoiceDate: date ? date.format("YYYY-MM-DD") : "",
                },
              ]);
            }}
            allowClear
            // Optionally restrict future dates:
            disabledDate={(current) =>
              current && current > moment().endOf("day")
            }
          />
        );
      },
    },

    {
      field: "taxInvoiceAmount",
      headerName: "Tax Invoice Value",
      minWidth: 200,
      flex: 1,
      renderCell: (params) => (
        <TextField
          size="small"
          fullWidth
          type="number"
          sx={{ mt: 0.625 }} // 5px margin top
          value={params.row.taxInvoiceAmount || ""}

          disabled={!rowFiles[params.row.id]}
          onChange={(e) => {
            const value = e.target.value;

            if (parseFloat(value) > 0) {
              params.api.updateRows([
                { ...params.row, taxInvoiceAmount: value },
              ]);
            } else {
              alert("Invoice Tax Amount must be greater than 0.");
            }
          }}
        />
      ),
    },
    {
      field: "action",
      headerName: "Action",
      minWidth: 280,
      flex: 1,
      renderCell: (params) =>
        statusFilter === "Done" ? (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              // color="primary"
              style={{
                background: "#1565C0",
                color: "white",
                marginLeft: "10px",
                marginRight: "10px",
              }}
              // startIcon={<FontAwesomeIcon icon={faDiamondTurnRight} />}
              onClick={() => handleShoworm(params.row.id, params.row)}
            >
              <FontAwesomeIcon icon={faEye} title="Contract Details" />
            </Button>
          </Stack>
        ) : editableRowId === params.row.id ? (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              // color="primary"
              style={{
                background: "green",
                color: "white",
                marginLeft: "10px",
              }}
              // startIcon={<SaveIcon />}
              onClick={() => handleSaveClick(params.row)}
            >
              Save
            </Button>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              // color="primary"
              style={{
                background: "green",
                color: "white",
                marginLeft: "10px",
              }}
              // startIcon={<SaveIcon />}
              onClick={() => handleSaveClick(params.row)}
            >
              Save
            </Button>

            <Button
              variant="contained"
              // color="primary"
              style={{
                background: "#1565C0",
                color: "white",
                marginLeft: "10px",
              }}
              // startIcon={<FontAwesomeIcon icon={faDiamondTurnRight} />}
              onClick={() => handleShoworm(params.row.id, params.row)}
            >
              <FontAwesomeIcon icon={faEye} title="Contract Details" />
            </Button>
          </Stack>
        ),
    },
  ];

  const invoiceColumns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
      minWidth: 90,
      flex: 1,
      editable: false,
      // hideable: true,
    },

    {
      field: "contractNo",
      headerName: "Contract No",
      minWidth: 130,
      flex: 1,
      renderCell: (params: any) => {
        return (
          <Stack direction="row" spacing={1}>
            <a
              href="#"
              style={{
                cursor: "pointer",
                color: "#1976d2",
                textDecoration: "underline",
              }}
              onClick={(e) => {
                e.preventDefault();
                handleShoworm(params.row.id, params.row);
              }}
            >
              {params.row.contractNo}
            </a>
          </Stack>
        );
      },
      editable: false,
    },
    {
      field: "customerName",
      headerName: "Customer Name",
      minWidth: 140,
      flex: 1,
      editable: false,
    },
    {
      field: "customerEmail",
      headerName: "Customer Email",
      minWidth: 140,
      flex: 1,
      editable: false,
    },
    { field: "poNo", headerName: "Po No.", minWidth: 120, flex: 1 },
    { field: "poDate", headerName: "Po Date", minWidth: 120, flex: 1 },
    {
      field: "poFileID",
      headerName: "PO Attachment",
      minWidth: 160,
      flex: 1,
      editable: false,
      renderCell: (params: any) => (
        // params.row.poFileID && params.row.poFileID.length > 0 ? (
        <>
          {/* {params.row.poDocuments.map((doc: any, idx: number) => ( */}
          <React.Fragment key={params.row.FileID}>
            <a
              href={params.row.poEncodedAbsUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={params.row.poFileLeafRef}
              style={{
                color: "#1976d2",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              {params.row.poFileLeafRef}
            </a>
            {/* {idx < params.row.poDocuments.length - 1 && ", "} */}
          </React.Fragment>
          {/* ))} */}
        </>
      ),
      // ) : (
      //   <span style={{ color: "#888" }}>No PO File</span>
      // ),
    },
    {
      field: "idocDocuments",
      headerName: "Invoice Attachment",
      minWidth: 160,
      flex: 1,
      editable: false,
      renderCell: (params: any) =>
        params.row.idocDocuments && params.row.idocDocuments.length > 0 ? (
          <>
            {params.row.idocDocuments.map((doc: any, idx: number) => (
              <React.Fragment key={doc.FileID}>
                <a
                  href={params.row.invoiceEncodedAbsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={params.row.invoiceFileLeafRef}
                  style={{
                    color: "#1976d2",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  {params.row.invoiceFileLeafRef}
                </a>
                {idx < params.row.idocDocuments.length - 1 && ", "}
              </React.Fragment>
            ))}
          </>
        ) : (
          <span style={{ color: "#888" }}>No Invoice File</span>
        ),
    },
    {
      field: "invoiceComments",
      headerName: "Invoice Description",
      minWidth: 120,
      flex: 1,
      editable: false,
    },
    {
      field: "invoiceAmount",
      headerName: "Invoice Amount",
      minWidth: 150,
      flex: 1,
      editable: false,
    },

    // Editable fields for Finance team
    {
      field: "invoiceInvoicNo",
      headerName: "Invoice No",
      type: "number",
      minWidth: 160,
      flex: 1,
      editable: false,
    },
    // {
    //   field: "invoiceInvoiceDate",
    //   headerName: "Invoice Date",

    //   minWidth: 160,
    //   flex: 1,
    //   editable: false,
    // },
    {
      field: "invoiceInvoiceDate",
      headerName: "Invoice Date",
      type: "date",
      minWidth: 160,
      flex: 1,
      editable: false,
      valueFormatter: (params: any) => {
        if (!params) return "";
        const date = new Date(params);
        if (isNaN(date.getTime())) return "";
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      },
    },
    {
      field: "taxInvoiceAmount",
      headerName: "Tax Invoice Value",
      type: "number",
      minWidth: 160,
      flex: 1,
      editable: false,
    },

    {
      field: "action",
      headerName: "Action",
      minWidth: 280,
      flex: 1,
      renderCell: (params) =>
        statusFilter === "Done" ? (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              // color="primary"
              style={{
                background: "#1565C0",
                color: "white",
                marginLeft: "10px",
                marginRight: "10px",
              }}
              // startIcon={<FontAwesomeIcon icon={faDiamondTurnRight} />}
              onClick={() => handleShoworm(params.row.id, params.row)}
            >
              <FontAwesomeIcon icon={faEye} title="Contract Details" />
            </Button>
          </Stack>
        ) : editableRowId === params.row.id ? (
          <Stack direction="row" spacing={1} />
        ) : (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              // color="primary"
              style={{
                background: "#1565C0",
                color: "white",
                marginLeft: "10px",
              }}
              startIcon={<FontAwesomeIcon icon={faDiamondTurnRight} />}
              onClick={() => handleShoworm(params.row.id, params.row)}
            >
              <FontAwesomeIcon icon={faEye} title="Contract Details" />
            </Button>
          </Stack>
        ),
    },
  ];

  // const rows: RowData[] = props.cmsDetails.map((item) => ({
  //   id: item.Id,
  //   contractNo: item.RequestID,
  //   customerName: item.CustomerName,
  //   productType: item.ProductType,
  //   isPaymentReceived: item.IsPaymentReceived,
  //   poNo: item.PoNo,
  //   poAmount: item.POAmount,
  //   poDate: item?.PoDate
  //     ? new Date(item.PoDate).toLocaleDateString("en-GB")
  //     : "",
  //   workTitle: item.WorkTitle,
  //   // upcomingInvoice: item.UpComingInvoiceDate,
  //   upcomingInvoice: item?.UpComingInvoiceDate
  //     ? new Date(item.UpComingInvoiceDate).toLocaleDateString("en-GB")
  //     : "",
  //   taxInvoiceAmount: item.NewInvoiceTaxAmount,
  //   totalPaymentRecievedAmt: item.NewPaymentTotal,
  //   totalPendingAmt: item.NewPendingTotal,
  //   employeeName: item.EmployeeName,
  //   employeeEmail: item.EmployeeEmail,
  //   accountManger: item.AccountManger,
  //   customerEmail: item.CustomerEmail,
  //   delegateEmployeeEmail: item.DelegateEmployeeEmail,
  //   companyName: item.CompanyName,
  //   govtContract: item.GovtContract,
  //   bgRequired: item.BGRequired,
  //   location: item.Location,
  //   customerLocation: item.CustomerLocation,
  //   workDetail: item.WorkDetails,
  //   renewalRequired: item.RenewalRequired,
  //   contractType: item.ContractType,
  //   // gstNo: item.GSTNo,
  //   bgDate: item.BGDate,
  //   accountMangerId: item.AccountMangerId,
  //   accountMangerEmail: item.AccountManger?.EMail || "",
  //   accountMangerTitle: item.AccountManger?.Title || "",
  //   projectMangerEmail: item.ProjectManager?.EMail || "",
  //   projectMangerTitle: item.ProjectManager?.Title || "",
  //   projectLeadEmail: item.ProjectLead?.EMail || "",
  //   projectLeadTitle: item.ProjectLead?.Title || "",

  //   docID: item.UID,

  //   invoiceDetails: item.invoiceDetails,
  //   currency: item.Currency,
  //   approverStatus: item.ApproverStatus,

  //   startDate: item.StartDateResource,
  //   endDate: item.EndDateResource,
  //   invoiceCriteria: item.InvoiceCriteria,

  //   TotalPaymentRecieved: Number(item.TotalPaymentRecieved ?? 0),
  //   TotalPendingAmount: Number(item.TotalPendingAmount ?? 0),
  //   InvoiceTaxAmount: Number(item.InvoiceTaxAmount ?? 0),
  // }));

  const rows: RowData[] = props.cmsDetails
    .filter((item) => item.CloseStatus !== "Deleted") // Exclude rows where CloseStatus is "Deleted"
    .map((item) => ({
      id: item.Id,
      contractNo: item.RequestID,
      customerName: item.CustomerName,
      productType: item.ProductType,
      isPaymentReceived: item.IsPaymentReceived,
      poNo: item.PoNo,
      poAmount: item.POAmount,
      paymentMode: item.PaymentMode,
      // poDate: item?.PoDate
      //   ? new Date(item.PoDate).toLocaleDateString("en-GB")
      //   : "",
      isAzureRequestClosed: item?.IsAzureRequestClosed,
      poDate:
        item?.PoDate &&
        new Date(item.PoDate).toLocaleDateString("en-GB") !== "01/01/1970"
          ? new Date(item.PoDate).toLocaleDateString("en-GB")
          : "",
      workTitle: item.WorkTitle,
      upcomingInvoice: item?.UpComingInvoiceDate
        ? new Date(item.UpComingInvoiceDate).toLocaleDateString("en-GB")
        : "",
      taxInvoiceAmount: item.NewInvoiceTaxAmount,
      totalPaymentRecievedAmt: item.NewPaymentTotal,
      totalPendingAmt: item.NewPendingTotal,
      employeeName: item.EmployeeName,
      employeeEmail: item.EmployeeEmail,
      accountManger: item.AccountManger,
      customerEmail: item.CustomerEmail,
      delegateEmployeeEmail: item.DelegateEmployeeEmail,
      companyName: item.CompanyName,
      govtContract: item.GovtContract,
      bgRequired: item.BGRequired,
      location: item.Location,
      customerLocation: item.CustomerLocation,
      workDetail: item.WorkDetails,
      renewalRequired: item.RenewalRequired,
      contractType: item.ContractType,
      bgDate: item.BGDate,
      accountMangerId: item.AccountMangerId,
      accountMangerEmail: item.AccountManger?.EMail || "",
      accountMangerTitle: item.AccountManger?.Title || "",
      projectMangerEmail: item.ProjectManager?.EMail || "",
      projectMangerTitle: item.ProjectManager?.Title || "",
      projectLeadEmail: item.ProjectLead?.EMail || "",
      projectLeadTitle: item.ProjectLead?.Title || "",
      docID: item.UID,
      invoiceDetails: item.invoiceDetails,
      currency: item.Currency,
      approverStatus: item.ApproverStatus,
      startDate: item.StartDateResource,
      endDate: item.EndDateResource,
      invoiceCriteria: item.InvoiceCriteria,
      TotalPaymentRecieved: Number(item.TotalPaymentRecieved ?? 0),
      TotalPendingAmount: Number(item.TotalPendingAmount ?? 0),
      InvoiceTaxAmount: Number(item.InvoiceTaxAmount ?? 0),
    }));

  const requestorRows: RowData[] = rows.filter(
    (row) =>
      row.employeeEmail === currentUserEmail ||
      row.accountMangerEmail === currentUserEmail ||
      row.delegateEmployeeEmail === currentUserEmail ||
      row.projectMangerEmail === currentUserEmail ||
      row.projectLeadEmail === currentUserEmail
  );

  const invoiceRows: RowData[] = props.cmsDetails
    .filter((item) => item.CloseStatus !== "Deleted")
    .flatMap((item) =>
      item.invoiceDetails.map(
        (
          detail: {
            TotalPaymentRecieved: any;
            TotalPendingAmount: any;
            InvoiceStatus: any;
            InvoiceAmount: any;
            InvoiceFileID: any;
            ClaimNo: any;
            PaymentStatus: any;
            Comments: any;
            InvoicNo: any;
            InvoiceTaxAmount: any;
            InvoiceDate: any;
            PaymentDate: any;
            ID: any;
            RequestID: any;
          },
          index: any
        ) => {
          const matchingPoDoc = contractDocuments.find(
            (doc) => `${doc.FileID}` === `${item.UID}`
          );

          return {
            id: `${item.Id}-${index}`,
            contractNo: item.RequestID,
            customerName: item.CustomerName,
            productType: item.ProductType,
            isAzureRequestClosed: item?.IsAzureRequestClosed,
            poNo: item.PoNo,
            poAmount: item.POAmount,
            paymentMode: item.PaymentMode,
            // poDate: new Date(item.PoDate).toLocaleDateString("en-GB"),
            poDate:
              item?.PoDate &&
              new Date(item.PoDate).toLocaleDateString("en-GB") !== "01/01/1970"
                ? new Date(item.PoDate).toLocaleDateString("en-GB")
                : "",
            workTitle: item.WorkTitle,
            upcomingInvoice: item.UpComingInvoiceDate,
            totalPaymentRecievedAmt: item.NewPaymentTotal,
            totalPendingAmt: item.NewPendingTotal,
            employeeName: item.EmployeeName,
            employeeEmail: item.EmployeeEmail,
            accountManger: item.AccountManger,
            accountMangerEmail: item.AccountManger?.EMail || "",

            projectLeadEmail: item.ProjectManager?.EMail || "",
            projectMangerEmail: item.ProjectManager?.EMail || "",
            projectMangerTitle: item.ProjectManager?.Title || "",
            accountMangerTitle: item.AccountManger?.Title || "",
            projectLeadTitle: item.AccountManger?.Title || "",

            customerEmail: item.CustomerEmail,
            delegateEmployeeEmail: item.DelegateEmployeeEmail,
            companyName: item.CompanyName,
            govtContract: item.GovtContract,
            bgRequired: item.BGRequired,
            location: item.Location,
            customerLocation: item.CustomerLocation,
            workDetail: item.WorkDetails,
            renewalRequired: item.RenewalRequired,
            contractType: item.ContractType,
            // gstNo: item.GSTNo,
            bgDate: item.BGDate,
            accountMangerId: item.AccountMangerId,

            docID: item.UID,
            invoiceDetails: item.invoiceDetails,
            currency: item.Currency,
            approverStatus: item.ApproverStatus,
            isPaymentReceived: item.IsPaymentReceived,
            invoiceStatus: detail.InvoiceStatus,
            invoiceAmount: detail.InvoiceAmount,
            paymentStatus: detail.PaymentStatus,
            invoiceComments: detail.Comments,
            invoiceInvoiceFileID: detail.InvoiceFileID,
            invoiceInvoicNo: detail.InvoicNo || "",
            taxInvoiceAmount: detail.InvoiceTaxAmount,
            invoiceInvoiceDate: detail.InvoiceDate
              ? new Date(detail.InvoiceDate)
              : new Date(),
            // ...existing code...
            // invoiceInvoiceDate: detail?.InvoiceDate
            //   ? new Date(detail?.InvoiceDate)
            //   : null,
            invoicePaymentDate: detail.PaymentDate,
            invoiceInvoiceID: detail.ID,
            invoiceInvoiceRequestID: detail.RequestID,
            // InvoiceTotalPaymentRecieved: item.TotalPaymentRecieved || 0,
            InvoiceTotalPaymentRecieved: detail.TotalPaymentRecieved || 0,
            TotalPaymentRecieved: item.TotalPaymentRecieved || 0,
            TotalPendingAmount: item.TotalPendingAmount || 0,
            InvoiceTaxAmount: item.InvoiceTaxAmount || 0,

            // changes here for 0 showing in TotalPendingAmoun

            // invoiceTotalPendingAmount: detail.TotalPendingAmount || 0,
            invoiceTotalPendingAmount:
              detail.TotalPendingAmount && detail.TotalPendingAmount > 0
                ? Number(detail.TotalPendingAmount)
                : Number(detail.InvoiceTaxAmount ?? 0),

            startDate: item.StartDateResource,
            endDate: item.EndDateResource,
            invoiceCriteria: item.InvoiceCriteria,

            poId: matchingPoDoc?.Id ?? null,
            poFileLeafRef: matchingPoDoc?.FileLeafRef ?? "",
            poFileID: matchingPoDoc?.FileID ?? "",
            poFileRef: matchingPoDoc?.FileRef ?? "",
            poAttachmentType: matchingPoDoc?.AttachmentType ?? "",
            poEncodedAbsUrl: matchingPoDoc?.EncodedAbsUrl ?? "",
          };
        }
      )
    );
  // console.log(requestorRows, "requestorRowsnow");

  // Add invoice document details to each row with key 'idocDocuments'
  const invoiceDocumentRows: RowData[] = invoiceRows.map((row) => {
    // console.log(invoiceRows, "invoiceRowsmatch");
    const matchingIdocDocs = invoiceDocuments.filter(
      (doc) => `${doc.DocID}` === `${row.invoiceInvoiceFileID}`
    );
    return {
      ...row,
      idocDocuments: matchingIdocDocs,
      invoiceFileLeafRef: matchingIdocDocs?.[0]?.FileLeafRef ?? "",

      invoiceFileRef: matchingIdocDocs?.[0]?.FileRef ?? "",

      invoiceEncodedAbsUrl: matchingIdocDocs?.[0]?.EncodedAbsUrl ?? "",
    };
  });

  const rowsWithDocuments = invoiceDocumentRows.map((invoice) => {
    const matchingDocs = contractDocuments.filter(
      (doc) => doc.FileID === invoice.docID
    );
    return {
      ...invoice,
      poDocuments: matchingDocs,
    };
  });
  // console.log(rowsWithDocuments, "rowsWithDocuments");

  const invoicePendingRows: RowData[] = rowsWithDocuments.filter(
    (row) => row.invoiceStatus === "Proceeded"
  );
  // console.log(invoicePendingRows, "invoicePendingRowstoday");

  const paymentPendingRows: RowData[] = invoiceRows
    .filter(
      (row) =>
        (row.invoiceStatus === "Generated" || row.invoiceStatus === "Added") &&
        row.paymentStatus !== "Yes"
    )
    .map((row) => ({
      ...row,
      paymentDate: row.paymentDate || "",
      paymentValue: row.paymentValue || "",
      pendingPayment: row.pendingPayment || "",
      addOnValue: row.addOnValue || "",
      comments: row.comments || "",
    }));

  // console.log(requestorRows, "requestorRowsrequestorRows");

  const filteredRows = requestorRows.filter((row) =>
    filterStatus === "Open"
      ? row.isPaymentReceived !== "Yes"
      : row.isPaymentReceived === "Yes"
  );
  // console.log(filteredRows, requestorRows, "requestorRows");
  const paymentCompletedRows: RowData[] = invoiceRows.filter(
    (row) => row.paymentStatus === "Yes"
  );

  const invoiceCompletedRows: RowData[] = rowsWithDocuments.filter(
    (row) =>
      row.invoiceStatus === "Generated" ||
      row.invoiceStatus === "Added" ||
      row.paymentStatus === "Yes"
  );

  // console.log(invoiceCompletedRows, "invoiceCompletedRows");

  const filteredFinanceRows: RowData[] = userGroups.includes("CMSAccountGroup")
    ? financeFilter === "Invoice Pending"
      ? statusFilter === "Pending"
        ? invoicePendingRows // Case 1: Invoice Pending + Pending
        : // ? invoiceRows // Case 1: Invoice Pending + Pending
          // : rowsWithDocuments // Case 2: Invoice Pending + Done
          invoiceCompletedRows // Case 2: Invoice Pending + Done
      : financeFilter === "Payment Pending"
      ? statusFilter === "Pending"
        ? paymentPendingRows // Case 3: Payment Pending + Pending
        : paymentCompletedRows // Case 4: Payment Pending + Done
      : []
    : rows;

  const refreshInvoiceDocuments = async () => {
    const data = await fetchAllInvoiceDocuments(siteUrl);
    setInvoiceDocuments(data);
  };

  const handleShoworm = (rowId: string, selectedRow: any) => {
    setSelectedRowId(rowId);
    setSelectedRow(selectedRow);
  };

  // Add this function inside your Dashboard component
  const isCellEditable = (params: any) => {
    // Only apply this logic for the relevant columns
    if (
      ["invoiceInvoicNo", "invoiceInvoiceDate", "taxInvoiceAmount"].includes(
        params.field
      )
    ) {
      return !!rowFiles[params.row.id];
    }

    return params.colDef.editable;
  };

  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [invoiceHistoryData, setInvoiceHistoryData] = React.useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);

  const handleHistoryClick = async (row: any) => {
    setHistoryLoading(true);
    setShowHistoryModal(true);

    const filterQuery = `$select=*,Author/Title&$expand=Author&$filter=CMSRequestItemID eq '${row.invoiceInvoiceID}'&$orderby=Id desc`;
    try {
      const response = await getSharePointData(
        props,
        "CMSPaymentHistory",
        filterQuery
      );

      setInvoiceHistoryData(response);
    } catch (error) {
      setInvoiceHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Inside your Dashboard component, before the return statement:
  const isGeneralUser =
    !userGroups.includes("CMSAccountGroup") &&
    !userGroups.includes("CMSAdminGroup");
  const visibleRows = filterRowsBySearch(
    isGeneralUser ? filteredRows : filteredFinanceRows,
    searchText
  );

  // Check if "Invoice Pending Amount" column is visible for this user
  const showPendingTotal =
    isGeneralUser && columns.some((col) => col.field === "TotalPendingAmount");

  // Calculate the total for "Invoice Pending Amount"
  const invoicePendingTotal = showPendingTotal
    ? visibleRows.reduce(
        (sum, row) => sum + (parseFloat(row.TotalPendingAmount) || 0),
        0
      )
    : 0;

  return (
    <Box sx={{ minHeight: "100vh", }}>
      {isLoading && <LoaderOverlay />}

      {!selectedRowId ? (
        <Box
          sx={{
            // backgroundColor: "white",
            borderRadius: 2,
            p: 2,
            maxWidth: "80vw",
            mx: "auto",
            // boxShadow: 3,
          }}
        >
          {/* {showSpecialButtons && (
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
             
              <Button
                variant={activePage === "finance" ? "contained" : "outlined"}
                color="secondary"
                onClick={handleFinancePageClick}
                sx={{
                  fontWeight: activePage === "finance" ? "bold" : "normal",
                  backgroundColor: activePage === "finance" ? "#1976d2" : undefined,
                  color: activePage === "finance" ? "white" : "#1976d2",
                  borderColor: "#1976d2",
                }}
              >
                Finance Page
              </Button>
              <Button
                variant={activePage === "admin" ? "contained" : "outlined"}
                color="primary"
                onClick={handleAdminPageClick}
                sx={{
                  fontWeight: activePage === "admin" ? "bold" : "normal",
                  backgroundColor: activePage === "admin" ? "#1976d2" : undefined,
                  color: activePage === "admin" ? "white" : "#1976d2",
                  borderColor: "#1976d2",
                }}
              >
                Admin Page
              </Button>
            </Stack>
          )} */}

          {/* <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
  {showFinanceButton && (
    <Button
      variant={activePage === "finance" ? "contained" : "outlined"}
      color="secondary"
      onClick={handleFinancePageClick}
      sx={{
        fontWeight: activePage === "finance" ? "bold" : "normal",
        backgroundColor: activePage === "finance" ? "#1976d2" : undefined,
        color: activePage === "finance" ? "white" : "#1976d2",
        borderColor: "#1976d2",
      }}
    >
      Finance Page
    </Button>
  )}
  {showAdminButton && (
    <Button
      variant={activePage === "admin" ? "contained" : "outlined"}
      color="primary"
      onClick={handleAdminPageClick}
      sx={{
        fontWeight: activePage === "admin" ? "bold" : "normal",
        backgroundColor: activePage === "admin" ? "#1976d2" : undefined,
        color: activePage === "admin" ? "white" : "#1976d2",
        borderColor: "#1976d2",
      }}
    >
      Admin Page
    </Button>
  )}
  {showRequesterButton && (
    <Button
      variant={activePage === "requester" ? "contained" : "outlined"}
      color="success"
      onClick={handleRequeterPageClick}
      sx={{
        fontWeight: activePage === "requester" ? "bold" : "normal",
        backgroundColor: activePage === "requester" ? "#388e3c" : undefined,
        color: activePage === "requester" ? "white" : "#388e3c",
        borderColor: "#388e3c",
      }}
    >
      Requester Page
    </Button>
  )}
</Stack> */}

          {/* Dropdown for CMSFinanceGroup */}
          {/* {userGroups.includes("CMSAccountGroup") && (
            <Box>
              
                <FormControl
                  sx={{
                    mb: 2,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    //justifyContent: "space-between", // Ensure filters are in a single row
                    gap: "20px", // Add spacing between elements
                  }}
                >
                  <label
                    htmlFor="finance-filter"
                    style={{ marginRight: "10px" }}
                  >
                    Form
                  </label>
                  <select
                    id="finance-filter"
                    value={financeFilter}
                    onChange={(e) => setFinanceFilter(e.target.value)}
                    style={{
                      minWidth: "200px",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  >
                    <option value="Invoice Pending">Invoice </option>
                    <option value="Payment Pending">Payment </option>
                  </select>

                  <FormLabel
                    component="legend"
                    style={{ marginRight: "10px", maxWidth: "90px" }}
                  >
                    Status
                  </FormLabel>
                  <RadioGroup
                    row
                    aria-label="status-filter"
                    name="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <FormControlLabel
                      value="Pending"
                      // control={<Radio />}
                      // label="Pending"
                      control={
                        <Radio
                          sx={{
                            color: "#FFC107",
                            "&.Mui-checked": { color: "#FFC107" },
                          }}
                        />
                      }
                      label={
                        <span style={{ color: "#FFC107", fontWeight: 500 }}>
                          Pending
                        </span>
                      }
                    />
                    <FormControlLabel
                      value="Done"
                      // control={<Radio />}
                      // label="Done"
                      control={
                        <Radio
                          sx={{
                            color: "green",
                            "&.Mui-checked": { color: "green" },
                          }}
                        />
                      }
                      label={
                        <span style={{ color: "green", fontWeight: 500 }}>
                          Done
                        </span>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              
              {userGroups.includes("CMSAccountGroup") &&
                financeFilter === "Payment Pending" &&
                statusFilter === "Pending" && (
                  <Box
                    sx={{
                      display: "flex",
                      // border: "5px solid #ccc",
                      borderRadius: "4px",
                      justifyContent: "flex-end",
                      mt: 2,
                      pr: 2,
                    }}
                  >
                    {(() => {
                      // Get visible rows
                      const visibleRows = filterRowsBySearch(
                        filteredFinanceRows,
                        searchText
                      );
                      // Calculate totals
                      const totalReceived = visibleRows.reduce(
                        (sum, row) =>
                          sum +
                          (parseFloat(row.InvoiceTotalPaymentRecieved) || 0),
                        0
                      );
                      const totalPending = visibleRows.reduce(
                        (sum, row) =>
                          sum +
                          (parseFloat(row.invoiceTotalPendingAmount) || 0),
                        0
                      );
                      return (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 4,
                            fontWeight: "bold",
                            fontSize: 16,
                          }}
                        >
                          <span>
                            Total Received Payment Amount:{" "}
                            {totalReceived.toLocaleString()}
                          </span>
                          <span>
                            Total Pending Payment Amount:{" "}
                            {totalPending.toLocaleString()}
                          </span>
                        </Box>
                      );
                    })()}
                  </Box>
                )}
            </Box>
          )} */}

          {userGroups.includes("CMSAccountGroup") && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              {/* Filter Controls */}
              <FormControl
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "20px",
                }}
              >
                <label htmlFor="finance-filter" style={{ marginRight: "10px" }}>
                  Form
                </label>
                <select
                  id="finance-filter"
                  value={financeFilter}
                  onChange={(e) => setFinanceFilter(e.target.value)}
                  style={{
                    minWidth: "200px",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                >
                  <option value="Invoice Pending">Invoice</option>
                  <option value="Payment Pending">Payment</option>
                </select>

                {/* Status label and radio buttons in a single row */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <span
                    style={{
                      minWidth: 60,
                      marginRight: 8,
                      fontWeight: 500,
                      color: "#666",
                    }}
                  >
                    Status
                  </span>
                  <RadioGroup
                    row
                    aria-label="status-filter"
                    name="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ gap: 2 }}
                  >
                    <FormControlLabel
                      value="Pending"
                      control={
                        <Radio
                          sx={{
                            color: "#FFC107",
                            "&.Mui-checked": { color: "#FFC107" },
                          }}
                        />
                      }
                      label={
                        <span style={{ color: "#FFC107", fontWeight: 500 }}>
                          Pending
                        </span>
                      }
                    />
                    <FormControlLabel
                      value="Done"
                      control={
                        <Radio
                          sx={{
                            color: "green",
                            "&.Mui-checked": { color: "green" },
                          }}
                        />
                      }
                      label={
                        <span style={{ color: "green", fontWeight: 500 }}>
                          Done
                        </span>
                      }
                    />
                  </RadioGroup>
                </Box>
              </FormControl>

              {/* Totals (conditionally rendered) */}
              {financeFilter === "Payment Pending" &&
              statusFilter === "Pending" ? (
                <Box
                  sx={{
                    display: "flex",
                    gap: 4,
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  {(() => {
                    const visibleRows = filterRowsBySearch(
                      filteredFinanceRows,
                      searchText
                    );
                    // const totalReceived = visibleRows.reduce(
                    //   (sum, row) =>
                    //     sum +
                    //     (parseFloat(row.InvoiceTotalPaymentRecieved) || 0),
                    //   0
                    // );
                    // console.log(totalReceived, "totalReceived");

                    const totalPending = visibleRows.reduce(
                      (sum, row) =>
                        sum + (parseFloat(row.invoiceTotalPendingAmount) || 0),
                      0
                    );
                    // console.log(totalPending, "totalPending");

                    return (
                      <>
                        {/* <span>
                Total Received Payment Amount:{" "}
                {totalReceived.toLocaleString()}
              </span> */}
                        <span style={{ color: "#035DA2" }}>
                          Total Pending Payment Amount:{" "}
                          {totalPending.toLocaleString()}
                        </span>
                      </>
                    );
                  })()}
                </Box>
              ) : (
                <Box sx={{ minWidth: 300 }} />
              )}
            </Box>
          )}

          {/* Conditionally render Radio Buttons for Open/Closed */}
          {!userGroups.includes("CMSAccountGroup") &&
            !userGroups.includes("CMSAdminGroup") && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <FormControl component="fieldset">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 16 }}
                  >
                    <FormLabel
                      component="legend"
                      style={{
                        marginRight: 12,
                        minWidth: 60,
                        paddingTop: "6px",
                      }}
                    >
                      Status
                    </FormLabel>
                    <RadioGroup
                      row
                      aria-label="status"
                      name="status"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      style={{ flexFlow: "nowrap" }}
                    >
                      <FormControlLabel
                        value="Open"
                        control={
                          <Radio
                            sx={{
                              color: "green",
                              "&.Mui-checked": { color: "green" },
                            }}
                          />
                        }
                        label={
                          <span style={{ color: "green", fontWeight: 500 }}>
                            Open
                          </span>
                        }
                        style={{ flexFlow: "nowrap" }}
                      />
                      <FormControlLabel
                        value="Closed"
                        control={
                          <Radio
                            sx={{
                              color: "red",
                              "&.Mui-checked": { color: "red" },
                            }}
                          />
                        }
                        label={
                          <span style={{ color: "red", fontWeight: 500 }}>
                            Closed
                          </span>
                        }
                        style={{ flexFlow: "nowrap" }}
                      />
                    </RadioGroup>
                  </div>
                </FormControl>
                {showPendingTotal && (
                  <Box
                    sx={{ fontWeight: "bold", color: "#035DA2", fontSize: 16 }}
                  >
                    Total Invoice Pending Amount:{" "}
                    {invoicePendingTotal.toLocaleString()}
                  </Box>
                )}
              </Box>
            )}

          {/* DataGrid Table */}
          {/* <Box mt={2} sx={{ height: "80vh", width: "100%" }}> */}
          {/* Search Box */}
          <Box
            sx={{
              mb: 2,
              width: "100%",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 4,
            }}
          >
            <TextField
              label="Search"
              variant="outlined"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="small"
              sx={{ maxWidth: 400 }}
            />
          </Box>
          <Box sx={{ height: "65vh", width: "100%" }}>
            <DataGrid
              rows={filterRowsBySearch(
                isGeneralUser ? filteredRows : filteredFinanceRows,
                searchText
              )}
              columns={
                userGroups.includes("CMSAccountGroup")
                  ? financeFilter === "Invoice Pending"
                    ? statusFilter === "Pending"
                      ? pendingInvoiceColumns
                      : invoiceColumns
                    : financeFilter === "Payment Pending"
                    ? statusFilter === "Pending"
                      ? pendingPaymentColumns
                      : paymentColumns
                    : columns
                  : columns
              }
              initialState={{
                columns: {
                  columnVisibilityModel: {
                    id: false, // Hides the "Age" column by default
                  },
                },
                // pinnedColumns:{ left: ['contractNo'] }
              }}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[5, 10, 15, 20]}   // 👈 Add this
              pagination             // 👈 Ensure pagination is enabled

              slots={{ toolbar: GridToolbar }}
              sx={{
                "& .MuiDataGrid-columnHeaders": {
                  color: "#035DA2",
                  fontWeight: "bold",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  whiteSpace: "normal",
                  lineHeight: "1.2",
                  textAlign: "center",
                },
                "& .MuiDataGrid-columnHeader": {
                  backgroundColor: "#F5F7F9",
                },
                "& .MuiButtonBase-root": {
                  color: "#035DA2",
                  fontWeight: "bold",
                },
                "& .contractNoCell": {
                  position: "sticky",
                  left: 0,
                  background: "#fff",
                  zIndex: 9,
                },
                "& .contractNoHeader": {
                  position: "sticky",
                  left: 0,
                  background: "#fff",
                  zIndex: 3,
                },
                "& .MuiDataGrid-footerContainer": {
                  justifyContent: "flex-end"  // 👈 pushes the whole footer content (dropdown, text, arrows) to the right
                }
              }}
              processRowUpdate={handleRowUpdate}
              isCellEditable={isCellEditable}
              slotProps={{
                toolbar: {
                  printOptions: { disableToolbarButton: true },
                },
              }}
            />
            {/* Footer for Payment Pending totals */}
          </Box>

          {/* Pagination Section */}
        </Box>
      ) : (
        <RequestForm
          rowEdit={`Yes`}
          rowId={selectedRowId} // Pass selectedRowId to RequestForm
          selectedRow={selectedRow} // Pass rows to RequestForm
          description={props.description}
          context={props.context}
          siteUrl={siteUrl}
          userGroups={props.userGroups}
          cmsDetails={props.cmsDetails}
          refreshCmsDetails={props.refreshCmsDetails}
          props={props}
        />
      )}

      {/* <FileUpload description={props.description} context={props.context} siteUrl={props.siteUrl} /> */}
      <Modal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Invoice Payment History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {historyLoading ? (
            <div className="text-center">Loading...</div>
          ) : invoiceHistoryData.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>S.no</th>
                    <th>Invoice Tax Amount</th>
                    <th>Payment Date</th>
                    <th>Payment Amount</th>
                    <th>Pending Amount</th>
                    <th>Remarks</th>
                    <th>Financer Name</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceHistoryData.map((item, index) => (
                    <tr key={item.Id}>
                      <td>{index + 1}</td>
                      <td>{item.InvoiceTaxAmount}</td>
                      <td>
                        {item.PaymentDate
                          ? moment(item.PaymentDate).format("DD-MM-YYYY")
                          : ""}
                      </td>
                      <td>{item.PaymentAmount}</td>
                      <td>{item.PendingAmount}</td>
                      <td>{item.Comment}</td>
                      <td>{item.FinancerName || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-danger fw-bold">
              No payment received on this invoice.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <BootstrapButton
            variant="secondary"
            onClick={() => setShowHistoryModal(false)}
          >
            Close
          </BootstrapButton>
        </Modal.Footer>
      </Modal>
    </Box>
  );
};

export default Dashboard;

// Fetch all items from ContractDocument library with selected fields
const fetchAllContractDocuments = async (siteUrl: string) => {
  const selectFields =
    "Id, FileLeafRef, FileID, FileRef, AttachmentType, EncodedAbsUrl";
  const libraryName = "ContractDocument";
  const filterQuery = `$filter=AttachmentType eq 'Po'&$top=5000`;
  // const filterQuery = "";

  try {
    const response = await getDocumentLibraryDataWithSelect(
      libraryName,
      filterQuery,
      selectFields,
      siteUrl
    );
    console.log("All ContractDocument items:", response);
    return response;
  } catch (error) {
    console.error("Error fetching ContractDocument items:", error);
    return [];
  }
};

const fetchAllInvoiceDocuments = async (siteUrl: string) => {
  const selectFields = "Id, FileLeafRef, FileRef,EncodedAbsUrl,DocID";
  const libraryName = "InvoiceDocument";
  const filterQuery = `$top=5000`;

  try {
    const response = await getDocumentLibraryDataWithSelect(
      libraryName,
      filterQuery,
      selectFields,
      siteUrl
    );
    console.log("All INVOICE items:", response);
    return response;
  } catch (error) {
    console.error("Error fetching invvoice Document items:", error);
    return [];
  }
};
