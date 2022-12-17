# AWS S3 Deploy GitHub Action

### Easily deploy a static website to AWS S3 and invalidate CloudFront distribution

This action is based on the work done by import-io on [s3-deploy](https://www.npmjs.com/package/s3-deploy).

## Usage

You can use this action by referencing the v3 branch

```yaml
uses: reggionick/s3-deploy@v3
with:
  folder: build
  bucket: ${{ secrets.S3_BUCKET }}
  bucket-region: us-east-1
```

## Arguments

S3 Deploy's Action supports inputs from the user listed in the table below:

| Input              | Type             | Required | Default   | Description                                                                               |
|--------------------|------------------|----------|-----------|-------------------------------------------------------------------------------------------|
| `folder`           | string           | Yes      |           | The folder to upload                                                                      |
| `bucket`           | string           | Yes      |           | The destination bucket                                                                    |
| `bucket-region`    | string           | Yes      |           | The destination bucket region                                                             |
| `dist-id`          | string           | No       | undefined | The CloudFront Distribution ID to invalidate                                              |
| `invalidation`     | string           | No       | '/'       | The CloudFront Distribution path(s) to invalidate                                         |
| `delete-removed`   | boolean / string | No       | false     | Removes files in S3, that are not available in the local copy of the directory            |
| `no-cache`         | boolean          | No       | false     | Use this parameter to specify `Cache-Control: no-cache, no-store, must-revalidate` header |
| `private`          | boolean          | No       | false     | Upload files with private ACL, needed for S3 static website hosting                       |
| `cache`            | string           | No       |           | Sets the Cache-Control: max-age=X header                                                  |
| `files-to-include` | string           | No       | "**"      | Allows for a glob pattern that matches files to include in the deployment                 |

### Example `workflow.yml` with S3 Deploy Action

```yaml
name: Example workflow for S3 Deploy
on: [ push ]
jobs:
  run:
    runs-on: ubuntu-latest
    env:
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: yarn

      - name: Build
        run: yarn build

      - name: Deploy
        uses: reggionick/s3-deploy@v3
        with:
          folder: build
          bucket: ${{ secrets.S3_BUCKET }}
          bucket-region: ${{ secrets.S3_BUCKET_REGION }}
          dist-id: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
          invalidation: /
          delete-removed: true
          no-cache: true
          private: true
          files-to-include: "{.*/*,*/*,**}"
```

## License

The code in this project is released under the [MIT License](LICENSE).
