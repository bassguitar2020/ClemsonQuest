import { db } from "@/lib/firebase";
import { PhotoSubmission } from "@/types/PhotoSubmission";
import { Quest } from "@/types/Quest";
import {
  collection,
  orderBy,
  query,
  onSnapshot,
  where,
  doc,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export const useQuests = () => {
  const [data, setData] = useState<Quest[]>([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "quests"), orderBy("expiresAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      const data: Quest[] = snapshot.docs
        .map((doc) => {
          const d = doc.data() as any;
          return {
            id: doc.id,
            title: d.title ?? "(no title)",
            description: d.description ?? "",
            points: d.points ?? 0,
            difficulty: d.difficulty ?? "Easy",
            createdAt: d.createdAt,
            expiresAt: d.expiresAt,
          };
        })
        .filter((q) => {
          if (!q.expiresAt) return true; // no expiration so always vis.
          const exp = q.expiresAt.toDate ? q.expiresAt.toDate() : q.expiresAt;
          return exp > now;
        });
      setData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { data, isLoading };
};

export const useQuest = ({ id }: { id: string }) => {
  const [data, setData] = useState<Quest | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const ref = doc(db, "quests", id);

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setData(null);
        setLoading(false);
        return;
      }

      const d = snap.data() as any;
      const q: Quest = {
        id: snap.id,
        title: d.title ?? "(no title)",
        description: d.description ?? "",
        points: d.points ?? 0,
        difficulty: d.difficulty ?? "Easy",
        createdAt: d.createdAt,
        expiresAt: d.expiresAt,
      };

      setData(q);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  return { data, isLoading };
};

export const useApprovedPhotoSubmissions = () => {
  const [data, setData] = useState<PhotoSubmission[]>([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "photoSubmissions"),
      where("status", "==", "approved"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: PhotoSubmission[] = snapshot.docs.map((doc) => {
        const d = doc.data() as any;
        return {
          id: doc.id,
          ...d,
        };
      });

      setData(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { data, isLoading };
};
