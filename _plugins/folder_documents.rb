# frozen_string_literal: true

# Folder-based documents for the output collections (projects, writeups).
#
# Jekyll's `:path` permalink placeholder keeps the file name, so
# `_projects/phishguard/index.md` would be published at
# `/projects/phishguard/index/` and relative image paths would break.
# This plugin publishes such a document at `/projects/phishguard/` instead,
# next to the images stored in the same folder, so plain markdown like
# `![Shot](shot.png)` just works.
#
# It also gives every document three extra fields that the templates use:
#
#   slug  name of the folder that holds the document   cookie-monster
#   ref   folder path inside the collection            picoctf-2025/web/cookie-monster
#   uid   `ref` with slashes replaced by dashes        picoctf-2025-web-cookie-monster
#
# And two SEO conveniences: `description` falls back to `summary`, and
# `image` falls back to the `cover` file.
module FolderDocuments
  SKIPPED_COLLECTIONS = %w(posts).freeze

  def self.apply(site)
    site.collections.each do |label, collection|
      next if SKIPPED_COLLECTIONS.include?(label)
      next unless collection.write?

      collection.docs.each { |doc| decorate(doc, label) }
    end
  end

  def self.decorate(doc, label)
    ref = doc.cleaned_relative_path.sub(%r!\A/+!, "").sub(%r!(\A|/)index\z!, "")
    return if ref.empty?

    base = "/#{label}/#{ref}/"
    data = doc.data

    data["ref"]  = ref
    data["slug"] = ref.split("/").last
    data["uid"]  = ref.tr("/", "-")
    data["permalink"] ||= base
    data["description"] ||= data["summary"] if data["summary"]

    cover = data["cover"]
    return unless cover.is_a?(String) && !cover.empty?
    return if cover.start_with?("/") || cover.include?("://")

    data["image"] ||= "#{base}#{cover}"
  end
end

Jekyll::Hooks.register :site, :post_read do |site|
  FolderDocuments.apply(site)
end
