import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {correctCastilianSourceWords} from '../scripts/evolutio-castellano-lote100.mjs';
import {verifyVendoredEvolutio,parseEvolutioGitTree,SOURCE_TREE}
 from '../scripts/verify-vendored-evolutio.mjs';
const root=resolve(import.meta.dirname,'..');

test('Evolutio conserva los 53 archivos binariamente idénticos al origen',async()=>{
 const report=await verifyVendoredEvolutio();
 assert.equal(report.treeSha,SOURCE_TREE);
 assert.equal(report.files,53);
 assert.equal(report.bytes,1608767);
 assert.equal(report.originalWords,522);
 assert.equal(report.sourcePath,'vendor/evolutio');
 assert.equal(report.canCompileWithoutCheckout,true);
 assert.equal(report.repositoryArchiveApproved,false);
 assert.equal(report.repositoryDeletionApproved,false);
});
test('Se rechazan rutas peligrosas, objetos inesperados y duplicados',()=>{
 const sha='0123456789012345678901234567890123456789';
 assert.throws(()=>parseEvolutioGitTree('100644 blob '+sha+'\t../extra\0'),/ruta insegura/);
 assert.throws(()=>parseEvolutioGitTree('100755 blob '+sha+'\tindex.html\0'),/modo u objeto/);
 assert.throws(()=>parseEvolutioGitTree('100644 blob '+sha+'\tindex.html\0'+
 '100644 blob '+sha+'\tindex.html\0'),/entradas duplicadas/);
});
test('El banco original no incorpora ni altera las 100 palabras adicionales de ScholaClassica',()=>{
 const original=JSON.parse(readFileSync(join(root,'vendor/evolutio/data/pilot.json'),'utf8'));
 assert.equal(original.words.length,522);
 assert.equal(new Set(original.words.map(w=>w.id)).size,522);
 const integrated=JSON.parse(readFileSync(join(root,'dist/apps/evolucion-fonetica/data/pilot.json'),'utf8'));
 assert.equal(integrated.words.length,622);
 assert.deepEqual(integrated.words.slice(0,522),correctCastilianSourceWords(original.words));
 assert.deepEqual(original.words.filter((w,i)=>JSON.stringify(w)!==JSON.stringify(integrated.words[i])).map(w=>w.id).sort(),["ge-EVF-0001","ge-EVF-0008","ge-EVF-0203","ge-EVF-0211","ge-EVF-0221","ge-EVF-0230","ge-EVF-0239","ge-EVF-0246","ge-EVF-0295","ge-EVF-0310","ge-EVF-0362","ge-EVF-0367","ge-EVF-0400","ge-EVF-0413","ge-EVF-0441","ge-EVF-0555","ge-EVF-0562","ge-EVF-0572","ge-EVF-0592","ge-EVF-0813","ge-EVF-0817","ge-EVF-0823","ge-EVF-0840","ge-EVF-0852","ge-EVF-0936","ge-EVF-1067","ge-EVF-1074","ge-EVF-1075","ge-EVF-1076","ge-EVF-1077","ge-EVF-1078","ge-EVF-1079","ge-EVF-1080","ge-EVF-1081","ge-EVF-1082","ge-EVF-1083","ge-EVF-1084","ge-EVF-1085","ge-EVF-1086","ge-EVF-1087","ge-EVF-1088","ge-EVF-1089","ge-EVF-1090","ge-EVF-1091","ge-EVF-1092","ge-EVF-1093","ge-EVF-1094","ge-EVF-1095","ge-EVF-1096","ge-EVF-1097","ge-EVF-1098","ge-EVF-1099","ge-EVF-1100","ge-EVF-1101","ge-EVF-1102","ge-EVF-1103","ge-EVF-1104","ge-EVF-1105","ge-EVF-1106","ge-EVF-1107","ge-EVF-1108","ge-EVF-1109","ge-EVF-1110","ge-EVF-1111","ge-EVF-1112","ge-EVF-1113","ge-EVF-1114","ge-EVF-1115","ge-EVF-1116","ge-EVF-1117","ge-EVF-1118","ge-EVF-1119","ge-EVF-1120","ge-EVF-1121","ge-EVF-1122","ge-EVF-1123","ge-EVF-1124","ge-EVF-1125","ge-EVF-1126","ge-EVF-1127","ge-EVF-1128","ge-EVF-1129","ge-EVF-1130","ge-EVF-1131","ge-EVF-1132","ge-EVF-1133","ge-EVF-1134","ge-EVF-1135","ge-EVF-1136","ge-EVF-1137","ge-EVF-1138","ge-EVF-1139","ge-EVF-1140","ge-EVF-1141","ge-EVF-1142","ge-EVF-1143","ge-EVF-1162","ge-EVF-1171","ge-EVF-1172","ge-EVF-1179","ge-EVF-1181","ge-EVF-1182","ge-EVF-1183","ge-EVF-1184","ge-EVF-1185","ge-EVF-1186","ge-EVF-1187","ge-EVF-1188","ge-EVF-1189","ge-EVF-1190","ge-EVF-1191","ge-EVF-1192","ge-EVF-1193","ge-EVF-1194","ge-EVF-1195","ge-EVF-1196","ge-EVF-1197","ge-EVF-1198","ge-EVF-1199","ge-EVF-1200","xl-1027","xl-1028","xl-1029","xl-1031","xl-1032","xl-1033","xl-1034","xl-1035","xl-1037","xl-1038","xl-1039","xl-1040","xl-1041","xl-1042","xl-1044","xl-1048","xl-105","xl-1050","xl-1052","xl-1053","xl-1055","xl-106","xl-110","xl-111","xl-113","xl-114","xl-115","xl-118","xl-122","xl-125","xl-126","xl-127","xl-129","xl-131","xl-132","xl-134","xl-143","xl-144","xl-145","xl-146","xl-147","xl-150","xl-151","xl-156","xl-161","xl-164","xl-165","xl-172","xl-173","xl-175","xl-182","xl-183","xl-185","xl-190","xl-191","xl-192","xl-194","xl-196","xl-198","xl-199","xl-201","xl-203","xl-205","xl-209","xl-210","xl-213","xl-215","xl-216","xl-218","xl-219","xl-220","xl-223","xl-227","xl-234","xl-239","xl-244","xl-245","xl-246","xl-248","xl-249","xl-25","xl-251","xl-252","xl-255","xl-257","xl-26","xl-266","xl-267","xl-268","xl-273","xl-274","xl-277","xl-278","xl-283","xl-284","xl-285","xl-289","xl-29","xl-297","xl-298","xl-30","xl-300","xl-301","xl-302","xl-304","xl-305","xl-307","xl-309","xl-313","xl-315","xl-32","xl-320","xl-33","xl-354","xl-36","xl-37","xl-385","xl-40","xl-42","xl-432","xl-44","xl-458","xl-46","xl-48","xl-502","xl-503","xl-508","xl-509","xl-514","xl-520","xl-527","xl-533","xl-539","xl-54","xl-567","xl-570","xl-576","xl-577","xl-58","xl-582","xl-583","xl-585","xl-592","xl-60","xl-602","xl-605","xl-606","xl-608","xl-61","xl-611","xl-614","xl-616","xl-63","xl-633","xl-64","xl-65","xl-69","xl-70","xl-71","xl-711","xl-716","xl-72","xl-720","xl-722","xl-724","xl-726","xl-727","xl-728","xl-731","xl-732","xl-733","xl-736","xl-747","xl-75","xl-750","xl-757","xl-78","xl-785","xl-794","xl-80","xl-804","xl-81","xl-82","xl-820","xl-825","xl-827","xl-830","xl-842","xl-851","xl-862","xl-87","xl-88","xl-917","xl-920","xl-921","xl-922","xl-927","xl-950","xl-96","xl-97","xl-98"]);
 assert.equal(new Set(integrated.words.map(w=>w.id)).size,622);
});
