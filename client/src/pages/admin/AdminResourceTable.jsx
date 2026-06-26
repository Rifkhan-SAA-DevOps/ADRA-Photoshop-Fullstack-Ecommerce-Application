import { Link } from "react-router-dom";
import { Edit3, Eye, ImageIcon, Trash2 } from "lucide-react";

export default function AdminResourceTable({
  items,
  type,
  showCategory = false,
  getTitle,
  getSubtitle,
  getMeta,
  onDelete,
}) {
  return (
    <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-white/[0.04]">
      <table className="admin-table w-full min-w-[860px]">
        <thead>
          <tr>
            <th>Image</th>
            <th>Title / Name</th>
            {showCategory && <th>Category</th>}
            <th>Status</th>
            <th>{type === "events" ? "Date" : "Price"}</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                {item.cover_image ? (
                  <img
                    src={item.cover_image}
                    alt=""
                    className="h-16 w-24 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="grid h-16 w-24 place-items-center rounded-2xl bg-white/10 text-white/35">
                    <ImageIcon size={20} />
                  </div>
                )}
              </td>

              <td>
                <p className="font-semibold">{getTitle(item)}</p>
                <p className="mt-1 line-clamp-1 text-xs text-white/40">
                  {getSubtitle(item)}
                </p>
              </td>

              {showCategory && (
                <td>
                  <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-100">
                    {item.category || "-"}
                  </span>
                </td>
              )}

              <td>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold capitalize text-white/75">
                  {item.status || "-"}
                </span>
              </td>

              <td>{getMeta(item)}</td>

              <td>
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString()
                  : "-"}
              </td>

              <td>
                <div className="flex gap-2">
                  <Link
                    to={`/admin/${type}/${item.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-500/20 px-3 py-2 text-sm text-violet-100 transition hover:bg-violet-500/30"
                  >
                    <Eye size={14} /> View
                  </Link>

                  <Link
                    to={`/admin/${type}/${item.id}/edit`}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm transition hover:bg-white/15"
                  >
                    <Edit3 size={14} /> Edit
                  </Link>

                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 px-3 py-2 text-sm text-red-200 transition hover:bg-red-500/30"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {!items.length && (
            <tr>
              <td
                colSpan={showCategory ? 7 : 6}
                className="py-10 text-center text-white/45"
              >
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}