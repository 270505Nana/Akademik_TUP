import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 50,
    backgroundColor: '#FFFFFF',
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  logo: {
    width: 52,
    height: 52,
    objectFit: 'contain',
  },
  headerTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#CC0000',
  },
  headerSub: {
    fontSize: 9,
    color: '#555',
    marginTop: 2,
  },
  divider: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#CC0000',
    marginVertical: 12,
  },
  bodyText: {
    fontSize: 9,
    lineHeight: 1.7,
    color: '#374151',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 7,
  },
  rowLabel: {
    width: 140,
    fontSize: 9,
    color: '#555',
  },
  rowSep: {
    width: 14,
    fontSize: 9,
    color: '#555',
  },
  rowValue: {
    flex: 1,
    fontSize: 9,
    color: '#111',
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
    marginBottom: 2,
  },
});

const fmt = (isoStr) => {
  if (!isoStr) return '-';
  return new Date(isoStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
};

const DokumenValidasiPDF = ({ data }) => {
  const rows = [
    { label: 'Jenis Dokumen',       value: 'SK TA/PA' },
    { label: 'Keterangan SK',       value: 'Penetapan Judul' },
    { label: 'NIM',                 value: data.nim },
    { label: 'Nama Mahasiswa',      value: data.namaMahasiswa },
    { label: 'Program Studi',       value: data.programStudi },
    { label: 'Fakultas',            value: 'DIREKTORAT KAMPUS PURWOKERTO' },
    { label: 'Judul Tugas Akhir',   value: `${data.judulTAId}\n(${data.judulTAEn})` },
    { label: 'Tanggal Berlaku SK',  value: fmt(data.tanggalBerlakuSK) },
    { label: 'Tanggal Berakhir SK', value: fmt(data.tanggalBerakhirSK) },
    { label: 'Status Sidang',       value: 'Telah diterbitkan SK' },
    { label: 'Pembimbing 1',        value: data.dosenPembimbing1 },
    { label: 'Pembimbing 2',        value: data.dosenPembimbing2 },
    { label: 'Status Aktif SK',     value: data.statusAktif },
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {data.logoUrl && <Image style={styles.logo} src={data.logoUrl} />}
          <View>
            <Text style={styles.headerTitle}>
              Validasi Dokumen/SK TA/PA Universitas Telkom
            </Text>
            <Text style={styles.headerSub}>Telkom University Purwokerto</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <Text style={styles.bodyText}>
          Dokumen digital dan atau cetak ini dapat dijadikan sebagai alat bukti yang sah,
          format dan isi telah sesuai dengan ketentuan yang berlaku sejak disahkan, dan
          secara otomatis terdaftar dan terdokumentasi dalam Sistem Informasi Akademik
          Universitas Telkom.
        </Text>
        <Text style={styles.sectionLabel}>Detail dokumen sebagai berikut:</Text>
        {rows.map(({ label, value }) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowSep}>:</Text>
            <Text style={styles.rowValue}>{value || '-'}</Text>
          </View>
        ))}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Validasi Dokumen ©2026</Text>
          <Text style={styles.footerText}>Universitas Telkom</Text>
        </View>
      </Page>
    </Document>
  );
};

export const generateDokumenValidasiBlob = async (data) => {
  const blob = await pdf(<DokumenValidasiPDF data={data} />).toBlob();
  return blob;
};

export const mapSktaDataToPDF = (sktaRequest, sktaResponse, logoUrl) => {
  const expDate     = sktaResponse?.expDate   ?? null;
  const berlakuDate = sktaResponse?.createdAt ?? null;
  const isAktif     = expDate ? new Date() < new Date(expDate) : true;

  return {
    nim:               sktaRequest?.student?.nim                 || '-',
    namaMahasiswa:     sktaRequest?.student?.name                || '-',
    programStudi:      sktaRequest?.student?.studyProgram?.name  || '-',
    judulTAId:         sktaRequest?.proposalTitleId              || '-',
    judulTAEn:         sktaRequest?.proposalTitleEn              || '-',
    dosenPembimbing1:  sktaRequest?.dosenPembimbing1?.name       || '-',
    dosenPembimbing2:  sktaRequest?.dosenPembimbing2?.name       || '-',
    tanggalBerlakuSK:  berlakuDate,
    tanggalBerakhirSK: expDate,
    statusAktif:       isAktif ? 'AKTIF' : 'TIDAK AKTIF',
    logoUrl:           logoUrl ?? null,
  };
};

export default DokumenValidasiPDF;