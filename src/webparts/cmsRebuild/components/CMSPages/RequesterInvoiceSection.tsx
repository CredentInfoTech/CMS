/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @rushstack/no-new-null */
/* eslint-disable no-void */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-unused-expressions*/
/* eslint-disable  prefer-const */
/* eslint-disable  react/no-unescaped-entities */
//iosthreiht
import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import "./RequesterInvoiceSection.module.scss";
import {
  updateDataToSharePoint,
  getSharePointData,
} from "../services/SharePointService"; // Adjust the import path as necessary
import { Modal, Button } from "react-bootstrap"; // Import Bootstrap Modal
import FinaceInvoiceSection from "./FinaceInvoiceSection";
import moment from "moment";
import { DatePicker } from "antd";
import {
  getDocumentLibraryDataWithSelect,
  handleDownload,
} from "../services/SharePointService";
import {
  // faPlus,
  faTrash,
  faClockRotateLeft,
  // faAngleUp,
  // faAngleDown,
} from "@fortawesome/free-solid-svg-icons";
import CreditNoteDetails from "./CreditNoteDetails";
interface InvoiceRow {
  id: number;
  InvoiceDescription: string;
  RemainingPoAmount: string;
  InvoiceAmount: string;
  InvoiceDueDate: string;
  InvoiceProceedDate: string;
  showProceed: boolean;
  InvoiceStatus: string; // Add InvoiceStatus to the interface
  PrevInvoiceStatus?: string; // Add PrevInvoiceStatus to track previous status
  CreditNoteStatus?: string; // Add CreditNoteStatus to track credit note status
  userInGroup: boolean; // Add userInGroup to the interface
  employeeEmail: string; // Add employeeEmail to the interface
  itemID: number | null;
  InvoiceNo: string;
  InvoiceDate: string;
  InvoiceTaxAmount: string;
  ClaimNo: number | null; // Updated to accept number | null
  DocId: string;
  InvoiceFileID: string;
  invoiceApprovalChecked?: boolean; // Add this property
}

export default function RequesterInvoiceSection({
  userGroups,
  invoiceRows,
  setInvoiceRows,
  handleInvoiceChange,
  addInvoiceRow,
  totalPoAmount,
  errors,
  isEditMode, // Add a prop to indicate edit mode
  approverStatus,
  currentUserEmail, // Add currentUser as a prop
  siteUrl,
  context, // Add context as a prop
  props,
  hideAddInvoiceButton,
  poAmount,
  startDate,
  endDate, // New prop
  disableDeleteInvoiceRow, // <-- New prop
  onProceedButtonCountChange,
  isCollapsed,
  setIsCollapsed, // Add to props:
  selectedRowDetails,
  // new props for approval checkbox (optional)
  invoiceApprovalChecked,
  setInvoiceApprovalChecked,
  setDeletedInvoiceItemIDs,
}: {
  userGroups: any;
  invoiceRows: InvoiceRow[];
  setInvoiceRows: React.Dispatch<React.SetStateAction<InvoiceRow[]>>;
  handleInvoiceChange: (
    index: number,
    field: string,
    value: string | number
  ) => void;

  addInvoiceRow: () => void;
  totalPoAmount: number;
  errors: { [key: string]: string };
  isEditMode: boolean; // New prop
  approverStatus: string; // New prop
  currentUserEmail: string; // New prop
  siteUrl: string; // New prop
  context: any;
  props: any;
  hideAddInvoiceButton: boolean;
  poAmount: number;
  startDate: any;
  endDate: any; // New prop
  disableDeleteInvoiceRow?: boolean; // <-- New prop
  onProceedButtonCountChange?: (count: number) => void;

  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>; // Add to props:
  selectedRowDetails?: any; // Add selectedRowDetails prop if needed
  invoiceApprovalChecked?: boolean;
  setInvoiceApprovalChecked?: React.Dispatch<React.SetStateAction<boolean>>;
  setDeletedInvoiceItemIDs?: React.Dispatch<React.SetStateAction<number[]>>;
}) {
  const InvoiceList = "CMSRequestDetails";
  const InvoiceHistory = "CMSPaymentHistory";
  console.log(siteUrl, "siteUrlinvoice123");
  console.log(props, "propsinvoice123");
  const [showEditModal, setShowEditModal] = React.useState(false); // State to control modal visibility
  const [selectedRow, setSelectedRow] = React.useState<InvoiceRow | null>(null); // State to store selected row data
  const [invoiceHistoryData, setInvoiceHistoryData] = React.useState<any[]>([]);
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [invoiceDocuments, setInvoiceDocuments] = React.useState<any[]>([]);
  const [showEditInvoiceColumn, setShowEditInvoiceColumn] =
    React.useState(false); // Add a state to track the visibility of the "Edit Invoice" column

  const [localInvoiceData, setLocalInvoiceData] = React.useState(
    invoiceRows.map((row) => ({
      InvoiceDescription: row.InvoiceDescription,
      InvoiceAmount: row.InvoiceAmount,
      InvoiceDueDate: row.InvoiceDueDate,
      RemainingPoAmount: row.RemainingPoAmount,
    }))
  );
  //   const [localInvoiceData, setLocalInvoiceData] = React.useState(
  //   invoiceRows.map((row) => ({
  //     InvoiceDescription: row.InvoiceDescription,
  //     InvoiceAmount: row.InvoiceAmount,
  //     InvoiceDueDate: row.InvoiceDueDate,
  //   }))
  // );
  // const [selectedRows, setSelectedRows] = React.useState<number[]>([]);

  // const allSelected =
  //   invoiceRows.length > 0 && selectedRows.length === invoiceRows.length;

  // const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.checked) {
  //     setSelectedRows(invoiceRows.map((row) => row.id));
  //   } else {
  //     setSelectedRows([]);
  //   }
  // };

  // const handleSelectRow =
  //   (id: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
  //     if (e.target.checked) {
  //       setSelectedRows((prev) => [...prev, id]);
  //     } else {
  //       setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
  //     }
  //   };
  // ...existing imports...
  // Adjust path if needed
  // console.log(userGroups, "userGroupsinvoice12");

  const fetchAllInvoiceDocuments = async (siteUrl: string) => {
    const selectFields = "Id, FileLeafRef, FileRef,EncodedAbsUrl,DocID";
    const libraryName = "InvoiceDocument";
    // const filterQuery = `$top=5000`;
    const filterQuery = `$top=5000`;
    // console.log(siteUrl, "siteUrlinvoice");

    try {
      const response = await getDocumentLibraryDataWithSelect(
        libraryName,
        filterQuery,
        selectFields,
        siteUrl
      );
      // console.log("All INVOICE items:", response);
      return response;
    } catch (error) {
      console.error("Error fetching invoice Document items:", error);
      return [];
    }
  };
  // ...existing code...

  React.useEffect(() => {
    void (async () => {
      const docs = await fetchAllInvoiceDocuments(props.siteUrl);
      setInvoiceDocuments(docs);
    })();
  }, [props.siteUrl]);

  // const pendingStatuses = ["Hold", "Open", "Pending From Approver", "Reminder"];
  // const [proceedClicked, setProceedClicked] = React.useState(false);
  const [proceededRows, setProceededRows] = React.useState<number[]>([]);
  // const deleteInvoiceRow = (id: number) => {
  //   setInvoiceRows(invoiceRows.filter((row) => row.id !== id));
  // };

  const deleteInvoiceRow = (id: number) => {
    // find the row about to be deleted
    const rowToDelete = invoiceRows.find((row) => row.id === id);

    // if in edit mode and row has an existing itemID, push it into parent's deleted IDs array
    if (props?.rowEdit === "Yes" && rowToDelete?.itemID) {
      const numericItemId = Number(rowToDelete.itemID);
      if (
        !isNaN(numericItemId) &&
        typeof setDeletedInvoiceItemIDs === "function"
      ) {
        setDeletedInvoiceItemIDs((prev) => {
          // avoid duplicates
          if (prev.includes(numericItemId)) return prev;
          return [...prev, numericItemId];
        });
      }
    }

    // remove the row from UI
    setInvoiceRows(invoiceRows.filter((row) => row.id !== id));
  };
  // ...existing code...

  // Handle input changes
  // const handleTextFieldChange = (
  //   index: number,
  //   field: keyof InvoiceRow,
  //   value: string
  // ) => {
  //   handleInvoiceChange(index, field, value);
  // };

  /*const handleTextFieldChange = (
    index: number,
    field: keyof InvoiceRow,
    value: string | number
  ) => {
    setInvoiceRows((prevRows) => {
      let updatedRows = [...prevRows];

      // Ensure the row exists before updating
      if (!updatedRows[index]) {
        console.error(`Row at index ${index} is undefined.`);
        return prevRows; // Return the previous state to avoid breaking
      }

      // Update the specific field in the row
      updatedRows[index] = { ...updatedRows[index], [field]: value };

      if (field === "InvoiceAmount") {
        const poAmt = parseFloat(totalPoAmount.toString()) || 0;

        // Recalculate RemainingPoAmount for every row
        let runningRemaining = poAmt;
        updatedRows = updatedRows.map((row, idx) => {
          const invoiceAmount = parseFloat(row.InvoiceAmount) || 0;

          // Update RemainingPoAmount for the current row
          const updatedRow = {
            ...row,
            RemainingPoAmount: runningRemaining.toFixed(2),
          };

          // Deduct the current row's InvoiceAmount from runningRemaining
          runningRemaining -= invoiceAmount;

          return updatedRow;
        });

        // Check if a new row needs to be added
        const totalInvoiceAmount = updatedRows.reduce(
          (sum, row) => sum + (parseFloat(row.InvoiceAmount) || 0),
          0
        );
        const remainingAfter = +(poAmt - totalInvoiceAmount).toFixed(2);
        const lastRow = updatedRows[updatedRows.length - 1];
        const lastRowHasValue =
          lastRow &&
          String(lastRow.InvoiceAmount).trim() !== "" &&
          Number(lastRow.InvoiceAmount) !== 0;

        if (poAmt > 0 && remainingAfter > 0 && lastRowHasValue) {
          // Append new blank row for continued entry
          const maxId =
            updatedRows.length > 0
              ? Math.max(...updatedRows.map((r) => r.id))
              : 0;
          updatedRows.push({
            id: maxId + 1,
            InvoiceDescription: "",
            RemainingPoAmount: remainingAfter.toFixed(2),
            InvoiceAmount: "",
            InvoiceDueDate: "",
            InvoiceProceedDate: "",
            showProceed: false,
            InvoiceStatus: "",
            userInGroup: false,
            employeeEmail: "",
            itemID: null as number | null,
            InvoiceNo: "",
            InvoiceDate: "",
            InvoiceTaxAmount: "",
            ClaimNo: null, // Updated to use null instead of an empty string
            DocId: "",
            InvoiceFileID: "",
            invoiceApprovalChecked: false, // Initialize here
          });
        }

        // Remove extra rows if the totalInvoiceAmount exceeds the PO amount
        if (remainingAfter <= 0) {
          updatedRows = updatedRows.filter(
            (row, idx) =>
              idx === 0 ||
              Number(row.InvoiceAmount) !== 0 ||
              idx < updatedRows.length - 1
          );
        }
      }

      // If rowEdit is enabled, update localInvoiceData
      if (props.rowEdit === "Yes") {
        setLocalInvoiceData(
          updatedRows.map((row) => ({
            InvoiceDescription: row.InvoiceDescription,
            InvoiceAmount: row.InvoiceAmount,
            InvoiceDueDate: row.InvoiceDueDate,
            RemainingPoAmount: row.RemainingPoAmount,
          }))
        );
      }

      // Log the updated rows for debugging
      console.log("Updated Invoice Rows:", updatedRows);

      return updatedRows;
    });

    // Log the field and value being updated
    console.log(`Field Updated: ${field}, Value: ${value}`);
  };*/

  const handleTextFieldChange = (
    index: number,
    field: keyof InvoiceRow,
    value: string | number
  ) => {
    setInvoiceRows((prevRows) => {
      let updatedRows = [...prevRows];

      // Ensure row exists before updating
      if (!updatedRows[index]) {
        console.error(`Row at index ${index} is undefined.`);
        return prevRows;
      }

      // Update specific field in the row
      updatedRows[index] = { ...updatedRows[index], [field]: value };

      if (field === "InvoiceAmount") {
        const poAmt = parseFloat(totalPoAmount.toString()) || 0;

        // Filter only rows that are NOT "Credit Note Uploaded"
        const validRows = updatedRows.filter(
          (row) => row.InvoiceStatus !== "Credit Note Uploaded"
        );

        let runningRemaining = poAmt;

        // Calculate RemainingPoAmount only for valid rows
        updatedRows = updatedRows.map((row) => {
          if (row.InvoiceStatus === "Credit Note Uploaded") {
            // Keep existing RemainingPoAmount as is for credit note rows
            return { ...row };
          }

          const invoiceAmount = parseFloat(row.InvoiceAmount) || 0;

          const updatedRow = {
            ...row,
            RemainingPoAmount: runningRemaining.toFixed(2),
          };

          runningRemaining -= invoiceAmount;
          return updatedRow;
        });

        // Calculate total invoice amount excluding "Credit Note Uploaded"
        const totalInvoiceAmount = validRows.reduce(
          (sum, row) => sum + (parseFloat(row.InvoiceAmount) || 0),
          0
        );

        const remainingAfter = +(poAmt - totalInvoiceAmount).toFixed(2);

        // Find the last valid (non-credit-note) row
        const lastValidRow = [...updatedRows]
          .reverse()
          .find((row) => row.InvoiceStatus !== "Credit Note Uploaded");

        const lastRowHasValue =
          lastValidRow &&
          String(lastValidRow.InvoiceAmount).trim() !== "" &&
          Number(lastValidRow.InvoiceAmount) !== 0;

        // Add a new row if there's remaining amount and the last valid row has a value
        if (poAmt > 0 && remainingAfter > 0 && lastRowHasValue) {
          const maxId =
            updatedRows.length > 0
              ? Math.max(...updatedRows.map((r) => r.id))
              : 0;

          updatedRows.push({
            id: maxId + 1,
            InvoiceDescription: "",
            RemainingPoAmount: remainingAfter.toFixed(2),
            InvoiceAmount: "",
            InvoiceDueDate: "",
            InvoiceProceedDate: "",
            showProceed: false,
            InvoiceStatus: "",
            userInGroup: false,
            employeeEmail: "",
            itemID: null,
            InvoiceNo: "",
            InvoiceDate: "",
            InvoiceTaxAmount: "",
            ClaimNo: null,
            DocId: "",
            InvoiceFileID: "",
            invoiceApprovalChecked: false,
          });
        }

        // Remove extra rows if total exceeds PO amount
        if (remainingAfter <= 0) {
          updatedRows = updatedRows.filter(
            (row, idx) =>
              idx === 0 ||
              Number(row.InvoiceAmount) !== 0 ||
              idx < updatedRows.length - 1
          );
        }
      }

      // If rowEdit is enabled, update local data
      if (props.rowEdit === "Yes") {
        setLocalInvoiceData(
          updatedRows.map((row) => ({
            InvoiceDescription: row.InvoiceDescription,
            InvoiceAmount: row.InvoiceAmount,
            InvoiceDueDate: row.InvoiceDueDate,
            RemainingPoAmount: row.RemainingPoAmount,
          }))
        );
      }

      console.log("Updated Invoice Rows:", updatedRows);
      return updatedRows;
    });

    console.log(`Field Updated: ${field}, Value: ${value}`);
  };

  const handleUpdateInvoiceRow = async (
    e: React.MouseEvent<HTMLButtonElement>,
    row: InvoiceRow
  ) => {
    console.log(row.itemID, "row.itemID");
    e.preventDefault(); // Prevent form submission
    if (!row.itemID) {
      console.error("Item ID is missing for the row.");
      return;
    }

    const requestData = {
      ProceedDate: moment(row.InvoiceProceedDate, "DD-MM-YYYY", true).isValid()
        ? moment(row.InvoiceProceedDate, "DD-MM-YYYY").format("YYYY-MM-DD")
        : moment().format("YYYY-MM-DD"), // fallback to current date

      InvoiceStatus: "Proceeded",
      RunWF: "Yes",
    };

    try {
      const response = await updateDataToSharePoint(
        InvoiceList,
        requestData,
        props.siteUrl,
        row.itemID
      );
      console.log("Invoice row updated successfully:", response);

      // Update the invoiceRows state to reflect the new status
      setInvoiceRows((prevRows) =>
        prevRows.map((r) =>
          r.id === row.id ? { ...r, InvoiceStatus: "Proceeded" } : r
        )
      );
      // setProceedClicked(true);
      setProceededRows((prev) => [...prev, row.id]); // <-- add row id here

      console.log(setInvoiceRows, invoiceRows, "setInvoiceRows");

      alert("Invoice row updated successfully!");
      // window.location.reload(); // Reload the page to reflect changes
    } catch (error) {
      console.error("Error updating invoice row:", error);
      alert("Failed to update invoice row.");
    }
  };
  // console.log(invoiceRows, "invoiceRowsabc"); // Log invoiceRows to check its value
  // console.log(approverStatus, "approverStatusinvoiceRowsabc"); // Log invoiceRows to check its value
  const handleHistoryClick = async (
    e: React.MouseEvent<HTMLButtonElement>,
    row: any
  ) => {
    e.preventDefault();
    // console.log(`History clicked for row ${row.itemID}`);
    // const filterQuery = `$filter=CMSRequestItemID eq '${row.itemID}'&$orderby=Id desc`;
    const filterQuery = `$select=*,Author/Title&$expand=Author&$filter=CMSRequestItemID eq '${row.itemID}'&$orderby=Id desc`;
    setSelectedRow(row); // Set the selected row to access its itemID

    setHistoryLoading(true);
    setShowHistoryModal(true); // Show modal before fetching (or after if you prefer)

    try {
      const response = await getSharePointData(
        { context },
        InvoiceHistory,
        filterQuery
      );
      // console.log("Invoice history fetched successfully:", response);
      setInvoiceHistoryData(response); // Store history data
      // console.log(invoiceHistoryData, "invoiceHistoryData");
      // console.log()
    } catch (error) {
      console.error("Error fetching invoice history:", error);
      setInvoiceHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowEditModal(false); // Close the modal
    setSelectedRow(null); // Clear the selected row data
  };
  // Safely parse and validate the date:
  // interface GetValidDate {
  //   (dateStr: string): moment.Moment | null;
  // }

  // const getValidDate: GetValidDate = (
  //   dateStr: string
  // ): moment.Moment | null => {
  //   console.log(dateStr, "dateStrgetValidDate");
  //   const parsed = moment(dateStr, "DD-MM-YYYY", true); // strict parsing
  //   return parsed.isValid() ? parsed : null; // fallback to null (empty)
  // };
  // console.log(getValidDate);

  // const handleInvoiceTextChange = (
  //   index: number,
  //   field: keyof InvoiceRow,
  //   value: string | number
  // ) => {
  //   setInvoiceRows((prevRows) => {
  //     let updatedRows = [...prevRows];

  //     // Ensure the row exists before updating
  //     if (!updatedRows[index]) {
  //       console.error(`Row at index ${index} is undefined.`);
  //       return prevRows; // Return the previous state to avoid breaking
  //     }

  //     // Update the specific field in the row
  //     updatedRows[index] = { ...updatedRows[index], [field]: value };

  //     if (field === "InvoiceAmount") {
  //       const poAmt = Number(totalPoAmount) || 0;

  //       // Recalculate RemainingPoAmount for every row
  //       let runningRemaining = poAmt;
  //       for (let idx = 0; idx < updatedRows.length; idx++) {
  //         const currentRow = updatedRows[idx];
  //         const currentInvoiceAmount = Number(currentRow.InvoiceAmount) || 0;

  //         if (idx === 0) {
  //           // For the first row, RemainingPoAmount is the total PO amount
  //           currentRow.RemainingPoAmount = runningRemaining.toFixed(2);
  //         } else {
  //           // For subsequent rows, RemainingPoAmount is calculated based on the previous row
  //           const prevRow = updatedRows[idx - 1];
  //           runningRemaining -= Number(prevRow.InvoiceAmount) || 0;
  //           currentRow.RemainingPoAmount = runningRemaining.toFixed(2);
  //         }

  //         // Deduct the current row's InvoiceAmount from the runningRemaining
  //         runningRemaining -= currentInvoiceAmount;
  //       }

  //       // Check if a new row needs to be added
  //       const totalInvoiceAmount = updatedRows.reduce(
  //         (sum, row) => sum + (Number(row.InvoiceAmount) || 0),
  //         0
  //       );
  //       const remainingAfter = +(poAmt - totalInvoiceAmount).toFixed(2);
  //       const lastRow = updatedRows[updatedRows.length - 1];
  //       const lastRowHasValue =
  //         lastRow &&
  //         String(lastRow.InvoiceAmount).trim() !== "" &&
  //         Number(lastRow.InvoiceAmount) !== 0;

  //       if (poAmt > 0 && remainingAfter > 0 && lastRowHasValue) {
  //         // Append new blank row for continued entry
  //         const maxId =
  //           updatedRows.length > 0
  //             ? Math.max(...updatedRows.map((r) => r.id))
  //             : 0;
  //         updatedRows.push({
  //           id: maxId + 1,
  //           InvoiceDescription: "",
  //           RemainingPoAmount: remainingAfter.toFixed(2),
  //           InvoiceAmount: "",
  //           InvoiceDueDate: "",
  //           InvoiceProceedDate: "",
  //           showProceed: false,
  //           InvoiceStatus: "",
  //           userInGroup: false,
  //           employeeEmail: "",
  //           itemID: null as number | null,
  //           InvoiceNo: "",
  //           InvoiceDate: "",
  //           InvoiceTaxAmount: "",
  //           ClaimNo: null, // Updated to use null instead of an empty string
  //           DocId: "",
  //           InvoiceFileID: "",
  //           invoiceApprovalChecked: false, // Initialize here
  //         });
  //       }
  //     }

  //     // If rowEdit is enabled, update localInvoiceData
  //     if (props.rowEdit === "Yes") {
  //       setLocalInvoiceData(
  //         updatedRows.map((row) => ({
  //           InvoiceDescription: row.InvoiceDescription,
  //           InvoiceAmount: row.InvoiceAmount,
  //           InvoiceDueDate: row.InvoiceDueDate,
  //           RemainingPoAmount: row.RemainingPoAmount,
  //         }))
  //       );
  //     }

  //     // Log the updated rows for debugging
  //     console.log("Updated Invoice Rows:", updatedRows);

  //     return updatedRows;
  //   });

  //   // Log the field and value being updated
  //   console.log(`Field Updated: ${field}, Value: ${value}`);
  // };

  const proceedButtonCount = invoiceRows.filter(
    (row) => row.InvoiceStatus === "Started"
  ).length;
  React.useEffect(() => {
    // console.log("proceedButtonCount:", proceedButtonCount);
    if (onProceedButtonCountChange) {
      onProceedButtonCountChange(proceedButtonCount);
    }
  }, [proceedButtonCount, onProceedButtonCountChange]);

  // (row add/remove handled in parent `RequestForm`)
  React.useEffect(() => {
    setLocalInvoiceData(
      invoiceRows.map((row) => ({
        InvoiceDescription: row.InvoiceDescription,
        InvoiceAmount: row.InvoiceAmount,
        InvoiceDueDate: row.InvoiceDueDate,
        RemainingPoAmount: row.RemainingPoAmount,
      }))
    );
  }, [invoiceRows]);

  // Function to handle local state updates for all fields
  const handleLocalFieldChange = (
    index: number,
    field: keyof InvoiceRow,
    value: string | number
  ) => {
    setLocalInvoiceData((prev) => {
      const updatedData = [...prev];
      updatedData[index] = { ...updatedData[index], [field]: value };
      return updatedData;
    });

    // Call handleInvoiceChange to update parent state
    handleInvoiceChange(index, field, value);
    // if (field === "InvoiceAmount") {
    //   handleInvoiceTextChange(index, field, value);
    // }
  };

  // Initialize local state for all fields
  React.useEffect(() => {
    if (
      props.rowEdit === "Yes" &&
      props.selectedRow?.approverStatus === "Approved"
    ) {
      const timers: number[] = [];

      invoiceRows.forEach((row, index) => {
        if (row.InvoiceStatus !== "Credit Note Uploaded") {
          const invoiceAmount = row.InvoiceAmount || "";

          const timer = window.setTimeout(() => {
            handleTextFieldChange(index, "InvoiceAmount", invoiceAmount);
            handleLocalFieldChange(index, "InvoiceAmount", invoiceAmount);
          }, 1000);

          timers.push(timer);
        }
      });

      return () => {
        timers.forEach((t) => clearTimeout(t));
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.rowEdit, props.selectedRow?.approverStatus, invoiceRows]);

  return (
    <div className="mt-4">
      <div
        className="d-flex justify-content-between align-items-center mb-3 sectionheader"
        style={{ padding: "7px 8px" }}
      >
        <div className="d-flex align-items-center justify-content-between">
          {/* Invoice section approval checkbox (editable mode shown by parent) */}
          {isEditMode &&
            props.selectedRow.employeeEmail === currentUserEmail &&
            props.selectedRow.isPaymentReceived !== "Yes" &&
            !["Approved", "Hold", "Pending From Approver", "Reminder"].includes(
              props.selectedRow.approverStatus
            ) &&
            props.selectedRow?.isCreditNoteUploaded !== "No" && (
              <span
                className="form-check me-2"
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginRight: 8,
                }}
              >
                <input
                  type="checkbox"
                  id="cbInvoice"
                  className="form-check-input"
                  checked={invoiceApprovalChecked}
                  onChange={(e) => {
                    setInvoiceApprovalChecked &&
                      setInvoiceApprovalChecked(e.target.checked);
                    setShowEditInvoiceColumn(e.target.checked); // Toggle visibility
                  }}
                  onClick={(ev) => ev.stopPropagation()}
                />
              </span>
            )}

          <h5
            className="fw-bold mt-2 me-2 headingColor"
            style={{ cursor: "pointer" }}
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-expanded={isCollapsed}
            aria-controls="poDetailsCollapse"
          >
            Invoice Details
          </h5>

          {/* <button
            type="button"
            className="btn btn-link"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-expanded={isCollapsed}
            aria-controls="poDetailsCollapse"
            style={{ textDecoration: "none", color: "#ffffff" }}
          >
             {isCollapsed ? (
              <FontAwesomeIcon icon={faAngleUp} />
            ) : (
              <FontAwesomeIcon icon={faAngleDown} />
            )}
          </button> */}
        </div>

        {/* Hide Add Invoice Button if hideAddInvoiceButton is true */}
        {/* {!isEditMode && !hideAddInvoiceButton && (
          <button
            type="button"
            className="btn btn-success"
            onClick={() => {
              if (!poAmount || poAmount === 0) {
                alert("Please enter PO amount before adding invoice rows.");
                return;
              }
              addInvoiceRow();
            }}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" /> Add Invoice
          </button>
        )} */}
      </div>

      {/* Responsive Table */}
      <div
        className={`${
          isCollapsed ? "collapse show" : "collapse"
        } sectioncontent`}
        id="poDetailsCollapse"
      >
        {/* <div className="table-responsive">
          <table className="table table-bordered align-middle" style={{ overflow: "scroll !important" }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: "200px !important" }}>S.No</th>
                <th style={{ width: "200px !important" }}>Invoice Description</th>
                <th style={{ width: "200px !important" }}>Remaining PO Amount</th>
                <th style={{ width: "200px !important" }}>
                  Invoice Amount<span style={{ color: "red" }}>*</span>
                </th >
                <th style={{ width: "200px !important" }}>
                  Invoice Due Date<span style={{ color: "red" }}>*</span>
                </th>
                {invoiceRows.some((row) => row.showProceed) && (
                  <th style={{ width: "200px !important" }}>Invoice Proceed Date</th>
                )}
                {invoiceRows.some(
                  (row) => row.InvoiceStatus === "Generated"
                ) && <th style={{ width: "200px !important" }}>Invoice Attachment</th>}
                <th style={{ width: "200px !important" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoiceRows
                .filter((row) => {
                  // If user belongs to CMSAccountGroup → apply filter
                  if (userGroups.includes("CMSAccountGroup")) {
                    return row.InvoiceStatus !== "Started";
                  }
                  // Otherwise → show all rows
                  return true;
                })
                .map((row, index) => (
                  <tr key={row.id}>
                    <td style={{ width: "200px !important" }}>{index + 1}</td>
                    <td style={{ width: "200px !important" }}>
                      <textarea
                        className={`form-control ${errors[`InvoiceDescription_${index}`]
                          ? "is-invalid"
                          : ""
                          }`}
                        value={row.InvoiceDescription}
                        onChange={(e) =>
                          handleTextFieldChange(
                            index,
                            "InvoiceDescription",
                            e.target.value
                          )
                        }
                        disabled={isEditMode} // Disable in edit mode
                      />
                      {errors[`InvoiceDescription_${index}`] && (
                        <div className="invalid-feedback">
                          {errors[`InvoiceDescription_${index}`]}
                        </div>
                      )}
                    </td>
                    <td style={{ width: "200px !important" }}>
                      <input
                        type="text"
                        className="form-control"
                        value={
                          index === 0
                            ? totalPoAmount.toFixed(2)
                            : row.RemainingPoAmount
                        }
                        disabled
                      />
                    </td>
                    <td style={{ width: "200px !important" }}>
                      <input
                        type="number"
                        className={`form-control ${errors[`InvoiceAmount_${index}`] ? "is-invalid" : ""
                          }`}
                        value={row.InvoiceAmount}
                        min={0}
                        step="any"
                        onChange={(e) => {
                          const value = e.target.value;
                          if (Number(value) < 0) return;
                          handleTextFieldChange(index, "InvoiceAmount", value);
                        }}
                        disabled={isEditMode} // Disable in edit mode
                      />
                      {errors[`InvoiceAmount_${index}`] && (
                        <div className="invalid-feedback">
                          {errors[`InvoiceAmount_${index}`]}
                        </div>
                      )}
                    </td>
                    <td style={{ width: "200px !important" }}>
                     
                      <DatePicker
                        type="date"
                        className={`form-control ${errors[`InvoiceDueDate_${index}`] ? "is-invalid" : ""
                          }`}
                        format="DD-MM-YYYY"
                        value={
                          row.InvoiceDueDate
                            ? moment(row.InvoiceDueDate, "DD-MM-YYYY")
                            : null
                        }
                        onChange={(date) =>
                          handleTextFieldChange(
                            index,
                            "InvoiceDueDate",
                            date ? date.format("DD-MM-YYYY") : ""
                          )
                        }
                        disabledDate={(current) =>
                          current && current < moment().startOf("day")
                        }
                        disabled={isEditMode} // Disable in edit mode
                        style={{ width: "150px !important" }}
                      />
                      {errors[`InvoiceDueDate_${index}`] && (
                        <div className="invalid-feedback">
                          {errors[`InvoiceDueDate_${index}`]}
                        </div>
                      )}
                    </td>
                    <td
                      style={{ width: "200px !important", display: row.showProceed ? "table-cell" : "none" }}
                    >
                      
                      <DatePicker
                        type="date"
                        format="DD-MM-YYYY"
                        // value={
                        //   row.InvoiceProceedDate === "01/01/1970"
                        //     ? moment()
                        //     : row.InvoiceProceedDate
                        //       ? moment(row.InvoiceProceedDate, "DD-MM-YYYY")
                        //       : null
                        // }
                        value={
                          !row.InvoiceProceedDate ||
                            row.InvoiceProceedDate === "01/01/1970"
                            ? moment()
                            : moment(row.InvoiceProceedDate, "DD-MM-YYYY")
                        }
                        onChange={(date) =>
                          handleTextFieldChange(
                            index,
                            "InvoiceProceedDate",
                            date ? date.format("DD-MM-YYYY") : ""
                          )
                        }
                        className="form-control"
                        disabled={isEditMode}
                        style={{ width: "150px !important" }}

                      />
                    </td>

                    {invoiceRows.some(
                      (row) => row.InvoiceStatus === "Generated"
                    ) && (
                        <td style={{ width: "200px !important" }}>
                          {row.InvoiceStatus === "Generated" ? (
                            <td>
                              {row.InvoiceFileID ? (
                                (() => {
                                  const file = invoiceDocuments.find(
                                    (doc: any) => doc.DocID === row.InvoiceFileID
                                  );
                                  return file ? (
                                    <button
                                      type="button"
                                      className="btn btn-link"
                                      // onClick={() =>
                                      //   window.open(file.EncodedAbsUrl, "_blank")
                                      // }
                                      onClick={(e) =>
                                        handleDownload(
                                          e,
                                          file.EncodedAbsUrl,
                                          { context }
                                        )
                                      }
                                    >
                                      {file.FileLeafRef}
                                    </button>
                                  ) : (
                                    <span>No file found</span>
                                  );
                                })()
                              ) : (
                                <span>No file found</span>
                              )}
                            </td>
                          ) : (
                            <td>Invoice Not Generated</td>
                          )}
                        </td>
                      )}

                    <td style={{ width: "200px !important" }}>
                      {isEditMode && row.showProceed && (
                        <>
                          {row.InvoiceStatus === "Started" &&
                            !proceededRows.includes(row.id) &&
                            row.employeeEmail === currentUserEmail &&
                            !pendingStatuses.includes(approverStatus) && (
                              <button
                                className="btn btn-primary me-2"
                                onClick={(e) => handleUpdateInvoiceRow(e, row)}
                              >
                                Proceed
                              </button>
                            )}
                          <button
                            className="btn btn-secondary me-2"
                            onClick={(e) => handleHistoryClick(e, row)}
                          >
                            <FontAwesomeIcon
                              icon={faClockRotateLeft}
                              title="Invoice History"
                            />
                          </button>
                        </>
                      )}
                     
                      {!isEditMode && (
                        <button
                          className="btn btn-danger"
                          onClick={() => deleteInvoiceRow(row.id)}
                          disabled={
                            invoiceRows.length === 1 || disableDeleteInvoiceRow
                          }
                          title="Delete Invoice Row"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div> */}

        <style>{`
          .tablescrollwrapper {
            overflow-x: auto;
            width: 100%;
          }
          .fixedcolumn, .fixed-th {
            min-width: 180px;
            max-width: 220px;
            width: 200px;
            white-space: nowrap;
          }
          .fixed-serial {
            min-width: 80px;
            max-width: 100px;
            width: 90px;
            white-space: nowrap;
          }
        `}</style>
        <div className="tablescrollwrapper">
          <table
            className="table table-bordered align-middle"
            style={{ minWidth: "1200px" }}
          >
            <thead className="table-light">
              <tr>
                <th className="fixed-th fixed-serial">S.No</th>
                {/* <th className="fixed-th "><input
                  type="checkbox"
                  style={{ marginLeft: 8 }}
                  checked={allSelected}
                  onChange={handleSelectAll}
                /></th> */}

                <th className="fixed-th">
                  Invoice Description <span style={{ color: "red" }}>*</span>
                </th>
                <th className="fixed-th">Remaining PO Amount</th>
                <th className="fixed-th">
                  Invoice Amount <span style={{ color: "red" }}>*</span>
                </th>
                <th className="fixed-th">
                  Invoice Due Date <span style={{ color: "red" }}>*</span>
                </th>
                {invoiceRows.some((row) => row.showProceed) && (
                  <th className="fixed-th">Invoice Proceed Date</th>
                )}
                {invoiceRows.some(
                  (row) =>
                    row.InvoiceStatus === "Generated" ||
                    row.InvoiceStatus === "Credit Note Uploaded" ||
                    row.PrevInvoiceStatus === "Generated"
                ) && <th className="">Invoice Attachment</th>}
                {/* <th className="">Invoice Status</th> */}
                {props.rowEdit === "Yes" && (
                  <th className="">Invoice Status</th>
                )}
                <th className="fixed-th">Action</th>
                {/* Add a new column header "Edit Invoice" if the checkbox condition is met */}
                {showEditInvoiceColumn && (
                  <th className="fixed-th">Edit Invoice</th>
                )}
              </tr>
            </thead>
            <tbody>
              {invoiceRows
                .filter((row) => {
                  // Debugging log to verify rows being rendered
                  console.log("Rendering row:", row);

                  // If user belongs to CMSAccountGroup → apply filter
                  if (userGroups.includes("CMSAccountGroup")) {
                    return !["Started", "Pending Approval", ""].includes(
                      row.InvoiceStatus
                    );
                  }

                  // Otherwise → show all rows
                  return true;
                })
                .slice()
                .sort((a, b) => {
                  const claimA =
                    a.ClaimNo !== null
                      ? Number(a.ClaimNo)
                      : Number.MAX_SAFE_INTEGER;
                  const claimB =
                    b.ClaimNo !== null
                      ? Number(b.ClaimNo)
                      : Number.MAX_SAFE_INTEGER;

                  // If both ClaimNo are null, sort by id
                  if (
                    claimA === Number.MAX_SAFE_INTEGER &&
                    claimB === Number.MAX_SAFE_INTEGER
                  ) {
                    return a.id - b.id;
                  }

                  return claimA - claimB;
                }) // .map((row, index) => (
                .map((row, index) => (
                  <tr key={row.id}>
                    <td className="fixedcolumn fixed-serial">{index + 1}</td>
                    {/* <td className="fixedcolumn "> <input
            type="checkbox"
            style={{ marginLeft: 8 }}
            checked={selectedRows.includes(row.id)}
            onChange={handleSelectRow(row.id)}
          /></td> */}
                    <td className="fixedcolumn">
                      <textarea
                        className={`form-control ${
                          errors[`InvoiceDescription_${index}`]
                            ? "is-invalid"
                            : ""
                        }`}
                        value={
                          props.rowEdit === "Yes"
                            ? localInvoiceData[index]?.InvoiceDescription || "" // Keep it blank if cleared
                            : row.InvoiceDescription
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          // if (props.rowEdit === "Yes") {
                          //   handleLocalFieldChange(
                          //     index,
                          //     "InvoiceDescription",
                          //     value
                          //   );
                          // }

                          if (props.rowEdit === "Yes") {
                            handleTextFieldChange(
                              index,
                              "InvoiceDescription",
                              value
                            );

                            handleLocalFieldChange(
                              index,
                              "InvoiceDescription",
                              value
                            );
                          } else {
                            handleTextFieldChange(
                              index,
                              "InvoiceDescription",
                              value
                            );
                          }
                        }}
                        // disabled={
                        //   props.rowEdit === "Yes"
                        //     ? !(
                        //         props.selectedRow?.employeeEmail ===
                        //           currentUserEmail &&
                        //         props.selectedRow?.selectedSections
                        //           ?.toLowerCase()
                        //           .includes("invoice") &&
                        //         props.selectedRow?.approverStatus ===
                        //           "Approved" &&
                        //         (row.InvoiceStatus === "" ||
                        //           row.InvoiceStatus === "Pending Approval" )
                        //       )
                        //     : false
                        // }

                        /* disabled={
                          props.rowEdit === "Yes"
                            ? !(
                                props.selectedRow?.employeeEmail ===
                                  currentUserEmail &&
                                props.selectedRow?.selectedSections
                                  ?.toLowerCase()
                                  .includes("invoice") &&
                                props.selectedRow?.approverStatus ===
                                  "Approved" &&
                                (row.InvoiceStatus === "" ||
                                  (row.InvoiceStatus === "Pending Approval" &&
                                    row.PrevInvoiceStatus !== "Generated")) 
                              )
                            : false
                        }*/

                        disabled={
                          props.rowEdit === "Yes"
                            ? !(
                                props.selectedRow?.employeeEmail ===
                                  currentUserEmail &&
                                props.selectedRow?.selectedSections
                                  ?.toLowerCase()
                                  .includes("invoice") &&
                                props.selectedRow?.approverStatus ===
                                  "Approved" &&
                                (row.InvoiceStatus === "" ||
                                  (row.InvoiceStatus === "Pending Approval" &&
                                    row.PrevInvoiceStatus !== "Generated"))
                              )
                            : false
                        }
                      />
                      {errors[`InvoiceDescription_${index}`] && (
                        <div className="invalid-feedback">
                          {errors[`InvoiceDescription_${index}`]}
                        </div>
                      )}
                    </td>
                    <td className="fixedcolumn">
                      <input
                        type="text"
                        className="form-control"
                        // value={
                        //   index === 0
                        //     ? totalPoAmount.toFixed(2)
                        //     : row.RemainingPoAmount
                        // }
                        value={
                          index === 0
                            ? totalPoAmount.toFixed(2) // Always set totalPoAmount for the first row
                            : props.rowEdit === "Yes"
                            ? localInvoiceData[index]?.RemainingPoAmount || "" // Use local data if in rowEdit mode
                            : row.RemainingPoAmount // Use the calculated RemainingPoAmount for other rows
                        }
                        disabled
                      />
                    </td>
                    <td className="fixedcolumn">
                      <input
                        type="number"
                        className={`form-control ${
                          errors[`InvoiceAmount_${index}`] ? "is-invalid" : ""
                        }`}
                        value={
                          props.rowEdit === "Yes"
                            ? localInvoiceData[index]?.InvoiceAmount || "" // Keep it blank if cleared
                            : row.InvoiceAmount
                        }
                        min={0}
                        step="any"
                        onChange={(e) => {
                          const value = e.target.value;
                          if (props.rowEdit === "Yes") {
                            handleTextFieldChange(
                              index,
                              "InvoiceAmount",
                              value
                            );

                            handleLocalFieldChange(
                              index,
                              "InvoiceAmount",
                              value
                            );
                          } else {
                            handleTextFieldChange(
                              index,
                              "InvoiceAmount",
                              value
                            );
                          }
                        }}
                        // disabled={
                        //   props.rowEdit === "Yes"
                        //     ? !(
                        //         props.selectedRow?.employeeEmail ===
                        //           currentUserEmail &&
                        //         props.selectedRow?.selectedSections
                        //           ?.toLowerCase()
                        //           .includes("invoice") &&
                        //         props.selectedRow?.approverStatus ===
                        //           "Approved" &&
                        //         (row.InvoiceStatus === "" ||
                        //           row.InvoiceStatus === "Pending Approval")
                        //       )
                        //     : false
                        // }
                        disabled={
                          props.rowEdit === "Yes"
                            ? !(
                                props.selectedRow?.employeeEmail ===
                                  currentUserEmail &&
                                props.selectedRow?.selectedSections
                                  ?.toLowerCase()
                                  .includes("invoice") &&
                                props.selectedRow?.approverStatus ===
                                  "Approved" &&
                                (row.InvoiceStatus === "" ||
                                  (row.InvoiceStatus === "Pending Approval" &&
                                    row.PrevInvoiceStatus !== "Generated"))
                              )
                            : false
                        }
                      />
                      {errors[`InvoiceAmount_${index}`] && (
                        <div className="invalid-feedback">
                          {errors[`InvoiceAmount_${index}`]}
                        </div>
                      )}
                    </td>
                    <td className="fixedcolumn">
                      <DatePicker
                        format="DD-MM-YYYY"
                        value={
                          props.rowEdit === "Yes"
                            ? localInvoiceData[index]?.InvoiceDueDate
                              ? moment(
                                  localInvoiceData[index]?.InvoiceDueDate,
                                  "DD-MM-YYYY"
                                )
                              : null // Keep it blank if cleared
                            : row.InvoiceDueDate
                            ? moment(row.InvoiceDueDate, "DD-MM-YYYY")
                            : null
                        }
                        onChange={(date) => {
                          const value = date ? date.format("DD-MM-YYYY") : ""; // Handle null value
                          // if (props.rowEdit === "Yes") {
                          //   handleLocalFieldChange(
                          //     index,
                          //     "InvoiceDueDate",
                          //     value
                          //   );
                          // }

                          if (props.rowEdit === "Yes") {
                            handleTextFieldChange(
                              index,
                              "InvoiceDueDate",
                              value
                            );

                            handleLocalFieldChange(
                              index,
                              "InvoiceDueDate",
                              value
                            );
                          } else {
                            handleTextFieldChange(
                              index,
                              "InvoiceDueDate",
                              value
                            );
                          }
                        }}
                        disabledDate={(current) =>
                          current && current < moment().startOf("day")
                        }
                        // disabled={
                        //   props.rowEdit === "Yes"
                        //     ? !(
                        //         props.selectedRow?.employeeEmail ===
                        //           currentUserEmail &&
                        //         props.selectedRow?.selectedSections
                        //           ?.toLowerCase()
                        //           .includes("invoice") &&
                        //         props.selectedRow?.approverStatus ===
                        //           "Approved" &&
                        //         (row.InvoiceStatus === "" ||
                        //           row.InvoiceStatus === "Pending Approval")
                        //       )
                        //     : false
                        // }
                        disabled={
                          props.rowEdit === "Yes"
                            ? !(
                                props.selectedRow?.employeeEmail ===
                                  currentUserEmail &&
                                props.selectedRow?.selectedSections
                                  ?.toLowerCase()
                                  .includes("invoice") &&
                                props.selectedRow?.approverStatus ===
                                  "Approved" &&
                                (row.InvoiceStatus === "" ||
                                  (row.InvoiceStatus === "Pending Approval" &&
                                    row.PrevInvoiceStatus !== "Generated"))
                              )
                            : false
                        }
                      />
                      {errors[`InvoiceDueDate_${index}`] && (
                        <div className="invalid-feedback">
                          {errors[`InvoiceDueDate_${index}`]}
                        </div>
                      )}
                    </td>
                    {row.showProceed && (
                      <td className="fixedcolumn">
                        <DatePicker
                          type="date"
                          format="DD-MM-YYYY"
                          value={
                            !row.InvoiceProceedDate ||
                            row.InvoiceProceedDate === "01/01/1970"
                              ? moment()
                              : moment(row.InvoiceProceedDate, "DD-MM-YYYY")
                          }
                          onChange={(date) =>
                            handleTextFieldChange(
                              index,
                              "InvoiceProceedDate",
                              date ? date.format("DD-MM-YYYY") : ""
                            )
                          }
                          className="form-control"
                          disabled={isEditMode}
                        />
                      </td>
                    )}
                    {invoiceRows.some(
                      (r) =>
                        r.InvoiceStatus === "Generated" ||
                        r.InvoiceStatus === "Credit Note Uploaded" ||
                        r.PrevInvoiceStatus === "Generated"
                    ) && (
                      <td className="">
                        {row.InvoiceStatus === "Generated" ||
                        row.InvoiceStatus === "Credit Note Uploaded" ||
                        row.PrevInvoiceStatus === "Generated" ? (
                          row.InvoiceFileID ? (
                            (() => {
                              const file = invoiceDocuments.find(
                                (doc) => doc.DocID === row.InvoiceFileID
                              );
                              return file ? (
                                <button
                                  type="button"
                                  className="btn btn-link"
                                  onClick={(e) =>
                                    handleDownload(e, file.EncodedAbsUrl, {
                                      context,
                                    })
                                  }
                                >
                                  {file.FileLeafRef}
                                </button>
                              ) : (
                                <span>No file found</span>
                              );
                            })()
                          ) : (
                            <span>No file found</span>
                          )
                        ) : (
                          <span>Invoice Not Generated</span>
                        )}
                      </td>
                    )}
                    {/* {props.rowEdit === "Yes" && (
                    <td> {row.InvoiceStatus || "-"}</td>
                    )} */}
                    {props.rowEdit === "Yes" && (
                      <td>
                        <span
                          className={`badge rounded-pill px-3 py-2 text-capitalize ${
                            row.InvoiceStatus === "Started"
                              ? "bg-primary text-white"
                              : row.InvoiceStatus === "Proceeded"
                              ? "bg-warning text-dark"
                              : row.InvoiceStatus === "Generated"
                              ? "bg-info text-dark"
                              : row.InvoiceStatus === "Credit Note Uploaded"
                              ? "bg-success text-white"
                              : row.InvoiceStatus === "Pending Approval"
                              ? "bg-warning text-dark"
                              : "bg-secondary text-white"
                          }`}
                          style={{
                            display: "inline-block",
                            textAlign: "center",
                          }}
                        >
                          {row.InvoiceStatus || "Started"}
                        </span>
                      </td>
                    )}

                    <td className="fixedcolumn">
                      {isEditMode && row.showProceed && (
                        <>
                          {/* {row.InvoiceStatus === "Started" &&
                            !proceededRows.includes(row.id) &&
                            row.employeeEmail === currentUserEmail && (
                              // !pendingStatuses.includes(approverStatus) &&
                              <button
                                className="btn btn-primary me-2"
                                onClick={(e) => handleUpdateInvoiceRow(e, row)}
                              >
                                Proceed
                              </button>
                            )} */}
                          {row.InvoiceStatus === "Started" &&
                            !proceededRows.includes(row.id) &&
                            row.employeeEmail === currentUserEmail && (
                              <button
                                className="btn btn-primary me-2"
                                onClick={(e) => handleUpdateInvoiceRow(e, row)}
                              >
                                Proceed
                              </button>
                            )}
                          <button
                            className="btn btn-secondary me-2"
                            onClick={(e) => handleHistoryClick(e, row)}
                          >
                            <FontAwesomeIcon
                              icon={faClockRotateLeft}
                              title="Invoice History"
                            />
                          </button>
                        </>
                      )}
                      {isEditMode &&
                        row.employeeEmail === currentUserEmail &&
                        row.InvoiceStatus === "Proceed Approval" && (
                          <button className="btn btn-success" type="button">
                            Proceed approval pending
                          </button>
                        )}
                      {/* {!isEditMode && ( */}
                      {(!isEditMode ||
                        (props.rowEdit === "Yes" &&
                          props.selectedRow?.employeeEmail ===
                            currentUserEmail &&
                          props.selectedRow?.selectedSections
                            ?.toLowerCase()
                            .includes("invoice") &&
                          props.selectedRow?.approverStatus === "Approved" &&
                          row.InvoiceStatus === "Pending Approval" &&
                          row.PrevInvoiceStatus !== "Generated")) && (
                        <button
                          className="btn btn-danger"
                          onClick={() => deleteInvoiceRow(row.id)}
                          disabled={invoiceRows.length === 1}
                          title="Delete Invoice Row"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </td>
                    {/* Add a checkbox for each row in the "Edit Invoice" column if the condition is satisfied */}
                    {/* {showEditInvoiceColumn &&
                      row.InvoiceStatus !== "Credit Note Uploaded"  && ( */}
                    {showEditInvoiceColumn &&
                      row.InvoiceStatus !== "Credit Note Uploaded" &&
                      row.InvoiceStatus !== "Pending Approval" &&
                      row.CreditNoteStatus !== "Pending" && (
                        <td className="fixedcolumn">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            onChange={(e) =>
                              setInvoiceRows((prevRows) =>
                                prevRows.map((r) =>
                                  r.id === row.id
                                    ? {
                                        ...r,
                                        invoiceApprovalChecked:
                                          e.target.checked,
                                      }
                                    : r
                                )
                              )
                            }
                          />
                        </td>
                      )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* </div> */}

      {/* Modal for Edit */}
      <Modal
        show={showEditModal}
        onHide={handleCloseModal}
        centered
        dialogClassName="custommodalwidth" // Add custom class for width
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Invoice</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRow && (
            <FinaceInvoiceSection
              invoiceRow={selectedRow}
              siteUrl={props.siteUrl}
              context={context}
              currentUserEmail={currentUserEmail}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {errors.invoiceTotal && (
        <div className="text-danger fw-bold mt-2">{errors.invoiceTotal}</div>
      )}

      {/* Modal for Invoice History */}
      <Modal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Invoice Payment History / Credit Note Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {historyLoading ? (
            <div className="text-center">Loading...</div>
          ) : invoiceHistoryData.length > 0 ? (
            <div className="table-responsive">
              <h5>Invoice Payment History</h5>

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
                      {/* Adjust according to your SharePoint column names */}
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

          <div className="mt-4">
            <div key={selectedRow?.itemID} className="mb-3">
              <CreditNoteDetails
                invoiceID={
                  selectedRow?.itemID ? String(selectedRow.itemID) : ""
                } // Convert to string or fallback to an empty string
                props={props}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => setShowHistoryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
