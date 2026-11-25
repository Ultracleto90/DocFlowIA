import type { ProjectTopologyRecord } from '@/core/types';
import {
  getTopologiaProyectoModel,
  type TopologiaProyectoDoc,
} from '@/infrastructure/models/TopologiaProyecto';
import { getWriteConnection } from '@/lib/db/mongodb';

function toProjectTopologyRecord(
  doc: TopologiaProyectoDoc,
): ProjectTopologyRecord {
  return {
    id: doc._id.toString(),
    codigo_proyecto: doc.codigo_proyecto,
    nombre_proyecto: doc.nombre_proyecto,
    framework: doc.framework,
    source_mode: doc.source_mode,
    nodes: doc.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      label: n.label,
      ...(n.file_path ? { file_path: n.file_path } : {}),
      ...(n.route_path ? { route_path: n.route_path } : {}),
      ...(n.http_method ? { http_method: n.http_method } : {}),
      ...(n.svm_classification
        ? { svm_classification: n.svm_classification }
        : {}),
      ...(n.elements ? { elements: [...n.elements] } : {}),
      ...(n.csrf_protected !== undefined
        ? { csrf_protected: n.csrf_protected }
        : {}),
    })),
    edges: doc.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      relation: e.relation,
      label: e.label,
    })),
    metrics: { ...doc.metrics },
    topology_markdown: doc.topology_markdown,
    project_map_json: doc.project_map_json,
    llms_txt: doc.llms_txt,
    security_report: {
      summary: { ...doc.security_report.summary },
      findings: doc.security_report.findings.map((f) => ({ ...f })),
      stride_matrix: doc.security_report.stride_matrix.map((row) => ({
        ...row,
        affected_targets: [...row.affected_targets],
      })),
      security_markdown: doc.security_report.security_markdown,
    },
    updated_at:
      doc.updated_at instanceof Date
        ? doc.updated_at.toISOString()
        : new Date(doc.updated_at).toISOString(),
  };
}

export type UpsertProjectTopologyInput = Omit<
  ProjectTopologyRecord,
  'id' | 'updated_at'
>;

export const topologyRepository = {
  async findByProjectCode(
    codigo_proyecto: string,
  ): Promise<ProjectTopologyRecord | null> {
    const conn = await getWriteConnection();
    const TopologiaProyecto = getTopologiaProyectoModel(conn);
    const doc = await TopologiaProyecto.findOne({ codigo_proyecto })
      .lean<TopologiaProyectoDoc | null>();

    return doc ? toProjectTopologyRecord(doc) : null;
  },

  async findByProjectCodes(codigos: string[]): Promise<ProjectTopologyRecord[]> {
    if (codigos.length === 0) return [];
    const conn = await getWriteConnection();
    const TopologiaProyecto = getTopologiaProyectoModel(conn);
    const docs = await TopologiaProyecto.find({
      codigo_proyecto: { $in: codigos },
    }).lean<TopologiaProyectoDoc[]>();

    return docs.map(toProjectTopologyRecord);
  },

  async upsertByProjectCode(
    input: UpsertProjectTopologyInput,
  ): Promise<ProjectTopologyRecord> {
    const conn = await getWriteConnection();
    const TopologiaProyecto = getTopologiaProyectoModel(conn);

    const updated = await TopologiaProyecto.findOneAndUpdate(
      { codigo_proyecto: input.codigo_proyecto },
      {
        $set: {
          ...input,
          updated_at: new Date(),
        },
      },
      { upsert: true, new: true },
    ).lean<TopologiaProyectoDoc | null>();

    if (!updated) {
      throw new Error('Failed to upsert project topology');
    }

    return toProjectTopologyRecord(updated);
  },

  async deleteByProjectCode(codigo_proyecto: string): Promise<boolean> {
    const conn = await getWriteConnection();
    const TopologiaProyecto = getTopologiaProyectoModel(conn);
    const result = await TopologiaProyecto.deleteOne({ codigo_proyecto });
    return result.deletedCount > 0;
  },
};
