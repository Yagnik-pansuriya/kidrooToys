<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>XML Sitemap - Kidroo Toys</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            color: #334155;
            background-color: #f8fafc;
            margin: 0;
            padding: 30px;
          }
          #header {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px 30px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
          }
          #header h1 {
            color: #0f172a;
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 8px 0;
          }
          #header p {
            color: #64748b;
            font-size: 14px;
            margin: 0;
            line-height: 1.5;
          }
          #header a {
            color: #2563eb;
            text-decoration: none;
          }
          #header a:hover {
            text-decoration: underline;
          }
          .expl {
            margin-top: 12px;
            font-size: 13px;
            color: #475569;
            background-color: #f1f5f9;
            padding: 10px 14px;
            border-radius: 6px;
          }
          #content {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
            overflow: hidden;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          }
          th {
            background-color: #f1f5f9;
            color: #475569;
            text-align: left;
            padding: 12px 20px;
            font-weight: 600;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          td {
            padding: 12px 20px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
            vertical-align: middle;
          }
          tr:last-child td {
            border-bottom: none;
          }
          tr:hover td {
            background-color: #f8fafc;
          }
          .loc-link {
            color: #2563eb;
            text-decoration: none;
            font-weight: 500;
          }
          .loc-link:hover {
            text-decoration: underline;
          }
          .img-preview {
            width: 36px;
            height: 36px;
            border-radius: 6px;
            object-fit: cover;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
            margin-right: 8px;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
          }
          .badge-prod { background-color: #fce7f3; color: #be185d; }
          .badge-cat { background-color: #dbeafe; color: #1e40af; }
          .badge-page { background-color: #dcfce7; color: #15803d; }
        </style>
      </head>
      <body>
        <div id="header">
          <h1>Kidroo Toys XML Sitemap</h1>
          <p>This is a standard XML Sitemap generated for search engines like Google, Bing, and Yahoo to index <strong>Kidroo Toys</strong> (<a href="https://kidroo.in">https://kidroo.in</a>).</p>
          <div class="expl">
            You can find more information about XML sitemaps on <a href="http://sitemaps.org" target="_blank">sitemaps.org</a>. Number of URLs in this sitemap: <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong>.
          </div>
        </div>
        <div id="content">
          <table>
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 45%;">URL Location</th>
                <th style="width: 10%;">Images</th>
                <th style="width: 15%;">Last Modified</th>
                <th style="width: 15%;">Change Freq</th>
                <th style="width: 10%;">Priority</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td><xsl:value-of select="position()"/></td>
                  <td>
                    <xsl:if test="image:image/image:loc">
                      <img class="img-preview" src="{image:image/image:loc}" alt="thumb"/>
                    </xsl:if>
                    <a class="loc-link" href="{sitemap:loc}" target="_blank">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td>
                    <xsl:value-of select="count(image:image)"/>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:lastmod"/>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:changefreq"/>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:priority"/>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
