/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import * as React from "react";
import { useEffect, useState } from "react";
import { ICmsRebuildProps } from "../ICmsRebuildProps";
import ListDetail from "./ListDetail";
// import { SPHttpClient } from "@microsoft/sp-http";
import {
  //   updateDataToSharePoint,
  //   saveDataToSharePoint,
  //   getDocumentLibraryDataWithSelect,
  //   uploadFileWithMetadata,
  getSharePointData,
} from "../services/SharePointService"; // Import the service
import { Table } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";

interface DataType {
  key: React.Key;
  name: string;
  description: string;
  link: string;
}

export default function MasterLists(props: ICmsRebuildProps) {
  // const siteUrl = props.context.pageContext.web.absoluteUrl;
  const masterList = "CMSMasterListsDetail";
  const [listData, setListData] = useState<DataType[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  

  useEffect(() => {
    async function fetchData() {
      const data = await getSharePointData(props, masterList, "");
      const mappedData = (data || []).map((item: any, idx: number) => ({
        key: item.Id || idx,
        name: item.Title || "-",
        description: item.Description || "-",
        link: item.Link || "",
        // link: item.Link ? item.Link : "",
      }));
      setListData(mappedData);
    }
    fetchData();
  }, [props]);

  if (selectedList) {
    return (
      <ListDetail
        props={props}
        listName={selectedList}
        onExit={() => setSelectedList(null)}
      />
    );
  }



const columns: TableColumnsType<DataType> = [
  {
    title: "Name",
    dataIndex: "name",
    filterSearch: true,
    width: "30%",
    render: (text: string) => (
      <span style={{ fontWeight: "bold" }}>{text}</span>
    ),
  },
  {
    title: "Description",
    dataIndex: "description",
    width: "40%",
  },
  {
  title: "Link",
  dataIndex: "link",
  render: (text: string) =>
    text ? (
      <span
        style={{
          color: "#035DA2",
          height: "35px",
          width: "35px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "5px",
          fontSize: "25px",
          cursor: "pointer", // 👈 makes it clickable
          transition: "transform 0.2s ease",
        }}
        onClick={() => setSelectedList(text)} // 👈 opens the ListDetail component
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
      >
        <FontAwesomeIcon icon={faEdit} />
      </span>
    ) : (
      "-"
    ),
},

];

const onChange: TableProps<DataType>["onChange"] = (
  pagination,
  filters,
  sorter,
  extra
) => {
  console.log("params", pagination, filters, sorter, extra);
};





  return (
    <div
    //   style={{
    //     background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)',
    //     minHeight: '100vh',
    //     padding: '32px',
    //   }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "18px 0 24px 0",
          fontWeight: "bold",
          //   background: 'rgba(255,255,255,0.7)',
          //   borderRadius: '12px',
          //   boxShadow: '0 2px 12px 0 rgba(0,0,0,0.07)',
          //   marginBottom: '24px',
        }}
      >
        <h2
          style={{
            // fontWeight: 700,
            // color: '#2d3a6e',
            letterSpacing: "1px",
            margin: 0,
          }}
        >
          Master Lists Detail
        </h2>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 4px 24px 0 rgba(44,62,80,0.10)",
          padding: "24px",
        }}
      >
        <Table<DataType>
          columns={columns}
          dataSource={listData}
          onChange={onChange}
          pagination={{ pageSize: 10 }}
          bordered
          rowClassName={() => "ant-table-row-custom"}
          style={{ background: "transparent" }}
        />
      </div>
      <style>{`
        .ant-table-row-custom:nth-child(even) {
          background: #f6f8ff !important;
        }
        .ant-table-row-custom:hover {
          background: #e0e7ff !important;
        }
        .ant-table-thead > tr > th {
          background: #035DA2 !important;
          color: #fff !important;
          font-weight: 600;
          font-size: 16px;
        }
        .ant-table-tbody > tr > td {
          font-size: 15px;
        }
      `}</style>
    </div>
  );
}