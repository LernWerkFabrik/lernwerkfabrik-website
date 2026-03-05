"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  clearExamHistory,
  deleteExamResult,
  loadExamHistory,
  type StoredExamResult,
} from "@/lib/examStorage";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import Surface from "@/components/Surface";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ResultsListClient({ moduleId }: { moduleId: string }) {
  const [items, setItems] = useState<StoredExamResult[]>([]);

  function refresh() {
    setItems(loadExamHistory(moduleId));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  const best = useMemo(() => {
    if (!items.length) return null;
    return items.reduce((a, b) => (b.percent > a.percent ? b : a));
  }, [items]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* HEADER */}
      <Surface className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Prüfungshistorie</h1>
            <p className="text-sm text-muted-foreground">
              Modul:{" "}
              <span className="font-semibold text-foreground">{moduleId}</span>{" "}
              ⬢ gespeicherte Versuche im Browser
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/module/${moduleId}`}>Zum Modul</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href={`/exam/${moduleId}`}>Neue Prüfung</Link>
            </Button>
          </div>
        </div>
      </Surface>

      {/* OVERVIEW */}
      <Surface className="p-0">
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="space-y-2">
            <CardTitle className="flex flex-wrap items-center justify-between gap-3">
              <span>�Sbersicht</span>
              <Badge
                variant="secondary"
                className="rounded-full whitespace-nowrap min-w-[110px] justify-center"
              >
                {items.length}
                {"\u00A0"}Einträge
              </Badge>
            </CardTitle>

            <Separator className="bg-border/60" />

            {best ? (
              <p className="text-sm text-muted-foreground">
                Bestes Ergebnis:{" "}
                <span className="font-semibold text-foreground">
                  {best.percent}% ({best.sumPoints}/{best.totalPoints})
                </span>{" "}
                am {new Date(best.createdAt).toLocaleString()}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Noch keine gespeicherten Prüfungen.
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {items.length ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="rounded-full">
                        Alle löschen
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent className="sm:max-w-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Alle Ergebnisse löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Dadurch wird die komplette Prüfungshistorie für dieses Modul
                          aus deinem Browser entfernt. Das kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            clearExamHistory(moduleId);
                            refresh();
                          }}
                        >
                          Löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button
                    variant="secondary"
                    className="rounded-full"
                    onClick={refresh}
                  >
                    Aktualisieren
                  </Button>
                </div>

                <div className="space-y-3">
                  {items.map((x, idx) => (
                    <div
                      key={x.examId}
                      className="rounded-xl border bg-card/60 p-4 text-card-foreground backdrop-blur shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-medium">
                          Versuch {items.length - idx} ⬢{" "}
                          <span className="text-muted-foreground">
                            {new Date(x.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <Badge
                          variant={((typeof x.passed === "boolean" ? x.passed : x.percent >= 60)) ? "default" : "destructive"}
                          className="rounded-full"
                        >
                          {x.percent}% ({x.sumPoints}/{x.totalPoints})
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="rounded-full">
                          <Link href={`/results/${moduleId}/${x.examId}`}>�ffnen</Link>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" className="rounded-full">
                              Löschen
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent className="sm:max-w-lg">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Ergebnis löschen?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Dieser Versuch wird aus deinem Browser entfernt.
                                Das kann nicht rückgängig gemacht werden.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  deleteExamResult(moduleId, x.examId);
                                  refresh();
                                }}
                              >
                                Löschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      <p className="mt-2 text-xs text-muted-foreground">
                        ID: <span className="font-mono">{x.examId}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Du hast noch keine Prüfung gespeichert. Starte eine Prüfung und gib sie ab.
                </p>
                <Button asChild className="rounded-full">
                  <Link href={`/exam/${moduleId}`}>Zur Prüfung</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </Surface>
    </div>
  );
}

