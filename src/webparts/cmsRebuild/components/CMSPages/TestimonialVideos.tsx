/*eslint-disable @typescript-eslint/no-floating-promises */
/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from "react";
import { useEffect, useState } from "react";
import { ICmsRebuildProps } from "../ICmsRebuildProps";
import { getDocumentLibraryData } from "../services/SharePointService";
import LoaderOverlay from "./Loader";
import { Table } from "antd";
import type { TableColumnsType } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlay } from "@fortawesome/free-solid-svg-icons";

export default function TestimonialVideos(props: ICmsRebuildProps) {
  const testimonialDocs = "CMSUserManualVideos";
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocs() {
      try {
        const filterQuery =
          "$select=*,Id,FileLeafRef,Viewer,FileRef,EncodedAbsUrl,ServerRedirectedEmbedUri&$orderby=Id desc";
        const siteUrl = props.context.pageContext.web.absoluteUrl;
        const gettingData = await getDocumentLibraryData(
          testimonialDocs,
          filterQuery,
          siteUrl
        );
        setItems(gettingData);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDocs();
  }, [props.context]);

  // Table columns definition
  const columns: TableColumnsType<any> = [
    {
      title: "S. No.",
      dataIndex: "serial",
      width: "10%",
      render: (_: any, __: any, idx: number) => idx + 1,
    },
    {
      title: "Viewer",
      dataIndex: "Viewer",
      width: "25%",
      render: (text: string) => text || "-",
    },
    {
      title: "Tutorial",
      dataIndex: "FileLeafRef",
      width: "40%",
      render: (text: string) => text || "-",
    },
    {
      title: "Action",
      dataIndex: "EncodedAbsUrl",
      width: "15%",
      align: "center" as const,
      render: (url: string) =>
        url ? (
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#035DA2",
              fontSize: 22,
            }}
            onClick={() => setPlayingUrl(url)}
            title="Play Video"
          >
            <FontAwesomeIcon icon={faCirclePlay} />
          </button>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <div>
      {loading && <LoaderOverlay />}
      {!loading && (
        <>
          <div
            style={{
              textAlign: "center",
              padding: "18px 0 24px 0",
              fontWeight: "bold",
            }}
          >
            <h2
              style={{
                letterSpacing: "1px",
                margin: 0,
              }}
            >
              Testimonial Videos
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
            <Table
              columns={columns}
              dataSource={items}
              pagination={{ pageSize: 10 }}
              bordered
              rowClassName={() => "ant-table-row-custom"}
              style={{ background: "transparent" }}
              locale={{
                emptyText: (
                  <div style={{ textAlign: "center", padding: 16 }}>
                    No videos found.
                  </div>
                ),
              }}
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
          {/* Video Player Modal/Section */}
          {playingUrl && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              }}
              onClick={() => setPlayingUrl(null)}
            >
              <div
                style={{
                  background: "#fff",
                  padding: 20,
                  borderRadius: 8,
                  position: "relative",
                  minWidth: 320,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <video
                  src={playingUrl}
                  controls
                  autoPlay
                  style={{ width: 500, maxWidth: "80vw" }}
                />
                <button
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "none",
                    border: "none",
                    fontSize: 24,
                    cursor: "pointer",
                  }}
                  onClick={() => setPlayingUrl(null)}
                  title="Close"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
