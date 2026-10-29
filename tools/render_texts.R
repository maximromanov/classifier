# One-off: render the deployed app's markdown texts (www/*.md in adhfais_app2_local_10types.zip, 2025-06-14) to the
# HTML fragments in texts/, with markdown::mark() as Shiny's includeMarkdown() does. Changes of wording, all to match
# the static app: tfidf_comps "top 1,500 matches" -> "top 250 matches" (ruled; the data has 250) and `distance` ->
# `similarity` (the column's new name); the rolling notes "If you see an error and no rolling graph" -> "If you see
# "No data for this text." instead of the rolling graph" (the static app shows that message, not an error).
# Not needed to run the app.
# Usage: Rscript tools/render_texts.R <folder with the extracted .md files>
args <- commandArgs(trailingOnly = TRUE); src <- sub("/?$", "/", args[1])
for (f in c("intro_short", "assessment_book", "assessment_rolling", "assessment_rolling_ent", "assessment_author", "tfidf_comps", "comparables")) {
  md <- paste(readLines(paste0(src, f, ".md"), encoding = "UTF-8", warn = FALSE), collapse = "\n")
  if (f == "tfidf_comps") { stopifnot(grepl("top 1,500 matches", md, fixed = TRUE), grepl("`distance`", md, fixed = TRUE))
    md <- sub("top 1,500 matches", "top 250 matches", md, fixed = TRUE); md <- sub("`distance`", "`similarity`", md, fixed = TRUE) }
  if (f %in% c("assessment_rolling", "assessment_rolling_ent")) { stopifnot(grepl("If you see an error and no rolling graph", md, fixed = TRUE))
    md <- sub("If you see an error and no rolling graph", "If you see \"No data for this text.\" instead of the rolling graph", md, fixed = TRUE) }
  writeLines(enc2utf8(markdown::mark(text = md)), paste0("texts/", f, ".html"), useBytes = TRUE)
}
